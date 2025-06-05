import React from 'react';
import { Question } from '@/types/weekly-pulse';

type Props = {
  questions: Question[];
  answers?: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
};

const DynamicQuestions: React.FC<Props> = ({ questions, answers = {}, onChange }) => (
  <div>
    {questions.map((q) => (
      <div key={q.id} className="mb-4">
        <label className="block font-medium mb-1">{q.title}{q.required && ' *'}</label>
        {q.description && <div className="text-gray-500 mb-1">{q.description}</div>}
        {q.type === 'textarea' ? (
          <textarea
            className="w-full border rounded p-2"
            value={answers[q.id] || ''}
            onChange={e => onChange(q.id, e.target.value)}
            required={q.required}
          />
        ) : (
          <input
            className="w-full border rounded p-2"
            type={q.type === 'number' ? 'number' : 'text'}
            value={answers[q.id] || ''}
            onChange={e => onChange(q.id, e.target.value)}
            required={q.required}
          />
        )}
      </div>
    ))}
  </div>
);

export default DynamicQuestions; 