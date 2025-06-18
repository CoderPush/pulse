import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export interface Question {
  id: string;
  title?: string;
  text?: string;
  type: string;
  description?: string;
  required?: boolean;
  choices?: string[];
}

export function DailyPulseQuestionField({ q, value, onChange, submitting }: {
  q: Question;
  value: string | string[] | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | string[]; type: string; checked?: boolean } }) => void;
  submitting: boolean;
}) {
  if (q.type === 'textarea') {
    return (
      <Textarea
        name={q.id}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        required={q.required}
        placeholder={q.description}
        disabled={submitting}
      />
    );
  } else if (q.type === 'multiple_choice' && q.choices) {
    return (
      <div className="flex flex-col gap-2">
        {q.choices.map((choice) => (
          <label key={choice} className="flex items-center gap-2">
            <input
              type="radio"
              name={q.id}
              value={choice}
              checked={value === choice}
              onChange={onChange}
              required={q.required}
              disabled={submitting}
            />
            {choice}
          </label>
        ))}
      </div>
    );
  } else if (q.type === 'checkbox' && q.choices) {
    return (
      <div className="flex flex-col gap-2">
        {q.choices.map((choice) => (
          <label key={choice} className="flex items-center gap-2">
            <input
              type="checkbox"
              name={q.id}
              value={choice}
              checked={Array.isArray(value) ? value.includes(choice) : false}
              onChange={e => {
                const prev = Array.isArray(value) ? value : [];
                if (e.target.checked) {
                  onChange({ target: { name: q.id, value: [...prev, choice], type: 'checkbox', checked: true } });
                } else {
                  onChange({ target: { name: q.id, value: prev.filter((c: string) => c !== choice), type: 'checkbox', checked: false } });
                }
              }}
              disabled={submitting}
            />
            {choice}
          </label>
        ))}
      </div>
    );
  } else {
    return (
      <Input
        name={q.id}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        required={q.required}
        placeholder={q.description}
        disabled={submitting}
      />
    );
  }
} 