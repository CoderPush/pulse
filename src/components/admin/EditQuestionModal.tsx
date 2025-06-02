import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Question } from "@/types/weekly-pulse";

type EditQuestionModalProps = {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
};

export function EditQuestionModal({ question, open, onOpenChange, onSave }: EditQuestionModalProps) {
  const [form, setForm] = useState({
    title: question?.title || '',
    description: question?.description || '',
    type: question?.type || 'text',
    required: question?.required || false,
    version: 1,
    category: question?.category || '',
    display_order: question?.display_order ?? 0,
    choices: question?.choices ?? [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choiceErrors, setChoiceErrors] = useState<number[]>([]);

  useEffect(() => {
    if (question) {
      setForm({
        title: question.title,
        description: question.description || "",
        type: question.type,
        required: question.required,
        version: question.version,
        category: question.category || "",
        display_order: question.display_order ?? 0,
        choices: question.choices ?? [],
      });
      setError(null);
    }
  }, [question]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setChoiceErrors([]);
    if ((form.type === 'multiple_choice' || form.type === 'checkbox') && form.choices) {
      const emptyIndexes = form.choices.map((c, i) => (c.trim() === '' ? i : -1)).filter(i => i !== -1);
      if (emptyIndexes.length > 0) {
        setChoiceErrors(emptyIndexes);
        setError('Choices cannot be empty. Please fill in all options or remove empty ones.');
        setLoading(false);
        return;
      }
    }
    const filteredForm = {
      ...form,
      choices: (form.type === 'multiple_choice' || form.type === 'checkbox') && form.choices
        ? form.choices.filter(c => c.trim() !== '')
        : form.choices
    };
    try {
      if (!question) return;
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filteredForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update question');
      }
      onOpenChange(false);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="mb-1 block">Title</Label>
            <Input
              id="title"
              className="mt-1"
              value={form.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, title: e.target.value }))}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="description" className="mb-1 block">Description</Label>
            <Textarea
              id="description"
              className="mt-1"
              value={form.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, description: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="type" className="mb-1 block">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value: string) => setForm(f => ({ ...f, type: value }))}
              disabled={loading}
            >
              <SelectTrigger id="type" className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="checkbox">Checkbox (Multi-Select)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={form.required}
              onCheckedChange={(checked: boolean) => setForm(f => ({ ...f, required: !!checked }))}
              disabled={loading}
            />
            <Label htmlFor="required" className="mb-1">Required</Label>
          </div>
          <div>
            <Label htmlFor="version" className="mb-1 block">Version</Label>
            <Input
              id="version"
              type="number"
              className="mt-1"
              value={form.version}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, version: Number(e.target.value) }))}
              disabled={loading}
            />
          </div>
          {form.category && (
            <div>
              <Label htmlFor="category" className="mb-1 block">Category</Label>
              <Input
                id="category"
                className="mt-1"
                value={form.category}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, category: e.target.value }))}
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                This field is only used for core questions mapped to fixed columns in the submissions table. It cannot be changed.
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="display_order" className="mb-1 block">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              className="mt-1"
              value={form.display_order}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
              disabled={loading}
            />
          </div>
          {(form.type === 'multiple_choice' || form.type === 'checkbox') && (
            <div className="mt-4">
              <Label className="mb-1 block">Choices</Label>
              {form.choices && form.choices.length > 0 ? (
                <ul className="mb-2">
                  {form.choices.map((choice: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 mb-1">
                      <Input
                        value={choice}
                        onChange={e => {
                          const newChoices = [...form.choices];
                          newChoices[idx] = e.target.value;
                          setForm(f => ({ ...f, choices: newChoices }));
                          setChoiceErrors([]);
                        }}
                        className={`flex-1${choiceErrors.includes(idx) ? ' border-red-500 focus:ring-red-500' : ''}`}
                        placeholder={`Option ${idx + 1}`}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setForm(f => ({ ...f, choices: f.choices.filter((_, i) => i !== idx) }))}
                        aria-label="Remove choice"
                        disabled={loading}
                      >
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-muted-foreground mb-2">No choices yet.</div>
              )}
              {choiceErrors.length > 0 && (
                <div className="text-red-600 text-xs mb-2">Choices cannot be empty. Please fill in all options or remove empty ones.</div>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setForm(f => ({ ...f, choices: [...(f.choices || []), ''] }))}
                disabled={loading}
              >
                Add Choice
              </Button>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 