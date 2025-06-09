'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, User, Calendar } from 'lucide-react';

export type FollowUpQuestion = {
  id: number;
  text: string;
  short: string;
  type: string;
};

export type FollowUpFormValues = {
  name: string;
  description: string;
  questions: FollowUpQuestion[];
  users: string[];
  frequency: string;
  days: string[];
  reminderTime: string;
};

export type FollowUpFormProps = {
  initialValues: FollowUpFormValues;
  allUsers: { id: string; name: string }[];
  mode?: 'create' | 'edit';
  onSubmit: (values: FollowUpFormValues) => void;
  onCancel?: () => void;
};

export function FollowUpForm({ initialValues, allUsers, mode = 'create', onSubmit, onCancel }: FollowUpFormProps) {
  const [tab, setTab] = useState('questions');
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [questions, setQuestions] = useState<FollowUpQuestion[]>(initialValues.questions);
  const [users, setUsers] = useState<string[]>(initialValues.users);
  const [frequency, setFrequency] = useState(initialValues.frequency);
  const [days, setDays] = useState<string[]>(initialValues.days);
  const [reminderTime, setReminderTime] = useState(initialValues.reminderTime);

  const handleQuestionChange = (idx: number, field: string, value: string) => {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };
  const addQuestion = () => setQuestions(qs => [...qs, { id: Date.now(), text: '', short: '', type: 'open-ended' }]);
  const removeQuestion = (idx: number) => setQuestions(qs => qs.filter((_, i) => i !== idx));
  const toggleUser = (id: string) => {
    setUsers(u => u.includes(id) ? u.filter(uid => uid !== id) : [...u, id]);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ name, description, questions, users, frequency, days, reminderTime });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'edit' ? 'Edit Follow-up' : 'Create New Follow-up'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="mb-4">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="frequency">Frequency</TabsTrigger>
            </TabsList>
            <TabsContent value="questions">
              <form className="space-y-6" onSubmit={e => { e.preventDefault(); setTab('participants'); }}>
                <div>
                  <label className="block mb-1 font-medium">Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Description</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                </div>
                <div className="space-y-4">
                  <div className="font-semibold mb-2">Questions</div>
                  {questions.map((q, idx) => (
                    <div key={q.id} className="border rounded p-3 mb-2 bg-muted/30">
                      <div className="flex gap-2 items-center mb-2">
                        <span className="font-medium">Question {idx + 1}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeQuestion(idx)} disabled={questions.length === 1}>Remove</Button>
                      </div>
                      <Textarea
                        className="mb-2"
                        value={q.text}
                        onChange={e => handleQuestionChange(idx, 'text', e.target.value)}
                        placeholder="Enter question text"
                        rows={2}
                        required
                      />
                      <Input
                        className="mb-2"
                        value={q.short}
                        onChange={e => handleQuestionChange(idx, 'short', e.target.value)}
                        placeholder="Short question (for reports)"
                      />
                      <select
                        className="border rounded px-2 py-1"
                        value={q.type}
                        onChange={e => handleQuestionChange(idx, 'type', e.target.value)}
                      >
                        <option value="open-ended">Open-ended</option>
                        <option value="number">Number</option>
                        <option value="choice">Multiple Choice</option>
                      </select>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addQuestion} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Next: Participants</Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="participants">
              <form className="space-y-6" onSubmit={e => { e.preventDefault(); setTab('frequency'); }}>
                <div>
                  <label className="block mb-1 font-medium flex items-center gap-2"><User className="w-4 h-4" /> Assign Users</label>
                  <div className="flex flex-wrap gap-2">
                    {allUsers.map(u => (
                      <Button
                        key={u.id}
                        type="button"
                        variant={users.includes(u.id) ? 'default' : 'outline'}
                        onClick={() => toggleUser(u.id)}
                        className={users.includes(u.id) ? 'bg-blue-600 text-white' : ''}
                      >
                        {u.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setTab('questions')}>Back</Button>
                  <Button type="submit">Next: Frequency</Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="frequency">
              <form className="space-y-6" onSubmit={handleFormSubmit}>
                <div>
                  <label className="block mb-1 font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Frequency</label>
                  <select className="border rounded px-2 py-1 mb-2" value={frequency} onChange={e => setFrequency(e.target.value)}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="ad-hoc">Ad-hoc</option>
                  </select>
                  {frequency !== 'ad-hoc' && (
                    <div className="flex gap-2 mb-2">
                      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day => (
                        <label key={day} className="flex items-center gap-1">
                          <input type="checkbox" checked={days.includes(day)} onChange={() => setDays(d => d.includes(day) ? d.filter(x => x !== day) : [...d, day])} />
                          {day}
                        </label>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="block mb-1 font-medium">Reminder Time</label>
                    <Input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-between gap-2">
                  <Button type="button" variant="outline" onClick={() => setTab('participants')}>Back</Button>
                  <Button type="submit">{mode === 'edit' ? 'Save' : 'Finish'}</Button>
                  {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 