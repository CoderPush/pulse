import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyPulseQuestionField } from './DailyPulseClient';
import { SubmissionPeriod } from './DailyPulseCalendar';

interface Template {
  id: string;
  name: string;
  description: string;
}

export interface Question {
  id: string;
  title?: string;
  text?: string;
  type: string;
  description?: string;
  required?: boolean;
  choices?: string[];
}

interface DailyPulseFormProps {
  user: { id: string };
  period: SubmissionPeriod;
  questions: Question[];
  template: Template | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const DailyPulseForm: React.FC<DailyPulseFormProps> = ({ user, period, questions, template, onSuccess, onCancel }) => {
  const [form, setForm] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | string[]; type: string; checked?: boolean } }) {
    const { name, value, type, checked } =
      'target' in e && typeof e.target === 'object'
        ? {
            name: e.target.name,
            value: e.target.value,
            type: e.target.type,
            checked: 'checked' in e.target ? (e.target as { checked?: boolean }).checked : undefined,
          }
        : { name: '', value: '', type: '', checked: false };
    setForm(prev => {
      const newForm = { ...prev };
      if (type === 'checkbox') {
        const prevArr = Array.isArray(newForm[name]) ? (newForm[name] as string[]) : [];
        if (checked) {
          newForm[name] = [...prevArr, value as string];
        } else {
          newForm[name] = prevArr.filter((v: string) => v !== value);
        }
      } else {
        newForm[name] = value;
      }
      return newForm;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = (await import('@/utils/supabase/client')).createClient();
      // 1. Insert submission
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          submission_period_id: period.id,
          submitted_at: new Date().toISOString(),
          type: 'daily',
        })
        .select()
          .single();
        
    console.log('submission', submissionError, submission);
      if (submissionError || !submission) {
        setSubmitError('Failed to submit check-in. Please try again.');
        setSubmitting(false);
        return;
      }
      // 2. Insert answers
      const answers = questions.map((q: Question) => {
        let answer = form[q.id];
        if (Array.isArray(answer)) {
          answer = JSON.stringify(answer);
        }
        return {
          submission_id: submission.id,
          question_id: q.id,
          answer: answer || '',
        };
      });
      const { error: answersError } = await supabase
        .from('submission_answers')
        .insert(answers);
      if (answersError) {
        setSubmitError('Failed to save answers. Please try again.');
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      onSuccess();
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <Card className="my-4 border-green-400 shadow-lg">
      <CardContent className="py-6">
        {submitError && (
          <div className="mb-4 text-red-500 text-sm font-semibold text-center">{submitError}</div>
        )}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-lg font-bold text-green-700">{template?.name || 'Daily Check-in'}</span>
          <Badge className="bg-yellow-400 text-white flex items-center gap-1"><span>⏰</span>Missed</Badge>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {questions.map((q: Question) => (
            <div key={q.id}>
              <label className="block text-sm font-medium mb-1 text-gray-700">{q.title}</label>
              <DailyPulseQuestionField
                q={q}
                value={form[q.id]}
                submitting={submitting}
                onChange={handleChange}
              />
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Missed Check-in'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DailyPulseForm; 