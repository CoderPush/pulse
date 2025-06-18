import React, { useState } from 'react';
import { submitDailyPulse } from '../actions';
import DailyPulseFormInner from './DailyPulseFormInner';
import { handleFormFieldChange } from './handleFormFieldChange';
import type { Question, Template, SubmissionPeriod } from '@/types/followup';


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
  
  const handleChange = handleFormFieldChange(setForm);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitDailyPulse({
        userId: user.id,
        periodId: period.id,
        questions,
        form,
      });
      if (result.error) {
        setSubmitError(result.error + ' Please try again.');
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
    <DailyPulseFormInner
      form={form}
      questions={questions}
      submitting={submitting}
      submitError={submitError}
      onChange={handleChange}
      onSubmit={handleSubmit}
      template={template}
      showCancel={true}
      onCancel={onCancel}
      submitLabel="Submit Missed Check-in"
    />
  );
};

export default DailyPulseForm; 