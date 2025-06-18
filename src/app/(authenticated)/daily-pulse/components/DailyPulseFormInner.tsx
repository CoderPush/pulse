// This file has been moved from the root of daily-pulse to components/DailyPulseFormInner.tsx. 

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DailyPulseQuestionField } from './DailyPulseQuestionField';

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

interface DailyPulseFormInnerProps {
  form: Record<string, string | string[]>;
  questions: Question[];
  submitting: boolean;
  submitError: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | string[]; type: string; checked?: boolean } }) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  template?: Template | null;
  showCancel?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}

const DailyPulseFormInner: React.FC<DailyPulseFormInnerProps> = ({
  form,
  questions,
  submitting,
  submitError,
  onChange,
  onSubmit,
  template,
  showCancel = false,
  onCancel,
  submitLabel = 'Submit',
}) => {
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
        <form className="space-y-4" onSubmit={onSubmit}>
          {questions.map((q: Question) => (
            <div key={q.id}>
              <label className="block text-sm font-medium mb-1 text-gray-700">{q.title}</label>
              <DailyPulseQuestionField
                q={q}
                value={form[q.id]}
                submitting={submitting}
                onChange={onChange}
              />
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white" disabled={submitting}>
              {submitting ? 'Submitting...' : submitLabel}
            </Button>
            {showCancel && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DailyPulseFormInner; 