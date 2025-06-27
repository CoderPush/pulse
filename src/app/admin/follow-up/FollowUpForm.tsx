'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { createQuestionsAction } from './create/actions';
import { FollowUpQuestionsStep } from './components/FollowUpQuestionsStep';
import { FollowUpParticipantsStep } from './components/FollowUpParticipantsStep';
import { FollowUpFrequencyStep } from './components/FollowUpFrequencyStep';
import { FollowUpQuestion } from '@/types/followup';

export type FollowUpFormValues = {
  name: string;
  description: string;
  questions: FollowUpQuestion[];
  users: string[];
  frequency: string;
  days: string[];
  reminderTime: string;
  templateId?: string | null;
};

export type FollowUpFormProps = {
  initialValues: FollowUpFormValues;
  allUsers: { id: string; email: string; name?: string }[];
  mode?: 'create' | 'edit';
  onSubmit: (values: FollowUpFormValues) => void;
  onCancel?: () => void;
};

// --- MAIN FORM CONTAINER ---
export function FollowUpForm({ initialValues, allUsers, mode = 'create', onSubmit, onCancel }: FollowUpFormProps) {
  const [tab, setTab] = useState('questions');
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [questions, setQuestions] = useState<FollowUpQuestion[]>(initialValues.questions);
  const [users, setUsers] = useState<string[]>(initialValues.users);
  const [frequency, setFrequency] = useState(initialValues.frequency);
  const [days, setDays] = useState<string[]>(initialValues.days);
  const [reminderTime, setReminderTime] = useState(initialValues.reminderTime);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Client-side validation
  function validate() {
    setError(null);
    if (!name.trim()) return 'Template name is required.';
    if (questions.some(q => !q.title.trim())) return 'All question titles must be non-empty.';
    if (new Set(questions.map(q => q.title.trim().toLowerCase())).size !== questions.length) return 'Question titles must be unique.';
    for (const q of questions) {
      if ((q.type === 'multiple_choice' || q.type === 'checkbox') && (!q.choices || q.choices.length === 0 || q.choices.some(c => !c.trim()))) {
        return `Choices are required for question: "${q.title}"`;
      }
    }
    return null;
  }

  // Step 1: Questions Next
  const handleQuestionsNext = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    const result = await createQuestionsAction(questions, name, description);
    setLoading(false);
    if (result.success && result.templateId) {
      setTemplateId(result.templateId);
      setTab('participants');
    } else {
      setError(result.error || 'An unknown error occurred while saving questions.');
    }
  };
  
  // Step 2: Participants Next
  const handleParticipantsNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (users.length === 0) {
      setError('You must select at least one participant.');
      return;
    }
    setError(null);
    setTab('frequency');
  };

  // Step 3: Final Submit
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Final validation check
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setTab('questions'); // Go back to the questions tab if there's an error
      return;
    }
    if (users.length === 0) {
      setError('You must select at least one participant.');
      setTab('participants'); // Go back to participants if none selected
      return;
    }
    if (!templateId) {
      setError('Something went wrong, template was not created. Please go back to the questions step.');
      setTab('questions');
      return;
    }
    setError(null);
    onSubmit({ name, description, questions, users, frequency, days, reminderTime, templateId });
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{mode === 'edit' ? 'Edit Follow-up' : 'Create New Follow-up'}</CardTitle>
            {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
          </div>
          {error && <div className="text-red-600 font-medium mt-2 p-3 bg-red-50 border border-red-200 rounded-md">{error}</div>}
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="questions">1. Questions</TabsTrigger>
              <TabsTrigger value="participants">2. Participants</TabsTrigger>
              <TabsTrigger value="frequency">3. Frequency & Schedule</TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions">
              <FollowUpQuestionsStep
                name={name}
                setName={setName}
                description={description}
                setDescription={setDescription}
                questions={questions}
                setQuestions={setQuestions}
                error={error}
                loading={loading}
                onNext={handleQuestionsNext}
              />
            </TabsContent>
            
            <TabsContent value="participants">
              <FollowUpParticipantsStep
                users={users}
                setUsers={setUsers}
                allUsers={allUsers}
                onNext={handleParticipantsNext}
                onBack={() => setTab('questions')}
              />
            </TabsContent>
            
            <TabsContent value="frequency">
              <FollowUpFrequencyStep
                frequency={frequency}
                setFrequency={setFrequency}
                days={days}
                setDays={setDays}
                reminderTime={reminderTime}
                setReminderTime={setReminderTime}
                onSubmit={handleFormSubmit}
                onBack={() => setTab('participants')}
                mode={mode}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 