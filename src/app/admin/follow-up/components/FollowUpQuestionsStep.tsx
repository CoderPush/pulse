'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { FollowUpQuestion } from '@/types/followup';

export function FollowUpQuestionsStep({
  name,
  setName,
  description,
  setDescription,
  questions,
  setQuestions,
  error,
  loading,
  onNext,
}: {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  questions: FollowUpQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<FollowUpQuestion[]>>;
  error: string | null;
  loading: boolean;
  onNext: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const handleQuestionChange = (idx: number, field: string, value: any) => {
    setQuestions(qs => qs.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };
  const addQuestion = () => {
    setQuestions(qs => [
      ...qs,
      { id: Date.now().toString(), title: '', type: 'text', choices: [], description: '', required: false },
    ]);
  };
  const removeQuestion = (idx: number) => {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  };
  const handleChoiceChange = (qIdx: number, cIdx: number, value: string) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, choices: (q.choices || []).map((c, j) => j === cIdx ? value : c) } : q));
  };
  const addChoice = (qIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, choices: [...(q.choices || []), ''] } : q));
  };
  const removeChoice = (qIdx: number, cIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, choices: (q.choices || []).filter((_, j) => j !== cIdx) } : q));
  };

  return (
    <form className="space-y-6" onSubmit={onNext}>
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
            <Input
              value={q.title}
              onChange={e => handleQuestionChange(idx, 'title', e.target.value)}
              placeholder="Question text"
              className="w-full"
            />
            <Textarea className="mb-2" value={q.description || ''} onChange={e => handleQuestionChange(idx, 'description', e.target.value)} placeholder="Description" rows={2} />
            <select className="border rounded px-2 py-1 mb-2" value={q.type} onChange={e => handleQuestionChange(idx, 'type', e.target.value)}>
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="number">Number</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="checkbox">Checkbox</option>
            </select>
            <div className="mb-2 flex gap-4 items-center">
              <label className="block text-xs font-medium">Required</label>
              <input type="checkbox" checked={!!q.required} onChange={e => handleQuestionChange(idx, 'required', e.target.checked)} />
            </div>
            {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
              <div className="mb-2">
                <div className="font-medium text-sm mb-1">Choices</div>
                {(q.choices || []).map((choice, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-2 mb-1">
                    <Input value={choice} onChange={e => handleChoiceChange(idx, cIdx, e.target.value)} placeholder={`Choice ${cIdx + 1}`} className="flex-1" />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeChoice(idx, cIdx)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => addChoice(idx)}><Plus className="w-4 h-4 mr-1" /> Add Choice</Button>
              </div>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addQuestion} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
      </div>
      {error && <div className="text-red-600 font-medium mt-2">{error}</div>}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save and Continue'}
        </Button>
      </div>
    </form>
  );
} 