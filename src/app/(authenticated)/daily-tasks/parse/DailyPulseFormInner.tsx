import React from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Task } from "../page";

interface DailyPulseFormInnerProps {
  task: Partial<Task>;
  submitting: boolean;
  submitError: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  showCancel?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}

const DailyPulseFormInner: React.FC<DailyPulseFormInnerProps> = ({
  task,
  submitting,
  submitError,
  onChange,
  onSubmit,
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
          <span className="text-lg font-bold text-green-700">Edit Task</span>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Date</label>
            <input
              name="task_date"
              value={task.task_date || ''}
              onChange={onChange}
              required
              className="border rounded px-2 py-1 w-full"
              disabled={submitting}
              type="date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Project</label>
            <input
              name="project"
              value={task.project || ''}
              onChange={onChange}
              required
              className="border rounded px-2 py-1 w-full"
              disabled={submitting}
              type="text"
              placeholder="Project Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Bucket/Tag</label>
            <input
              name="bucket"
              value={task.bucket || ''}
              onChange={onChange}
              className="border rounded px-2 py-1 w-full"
              disabled={submitting}
              type="text"
              placeholder="e.g., #feature, #bugfix"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Hours</label>
            <input
              name="hours"
              value={task.hours || ''}
              onChange={onChange}
              required
              className="border rounded px-2 py-1 w-full"
              disabled={submitting}
              type="number"
              step="0.1"
              placeholder="2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Task Description</label>
            <textarea
              name="description"
              value={task.description || ''}
              onChange={onChange}
              required
              className="border rounded px-2 py-1 w-full"
              disabled={submitting}
              rows={3}
              placeholder="What did you work on?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Link (Optional)</label>
            <input
              name="link"
              value={task.link || ''}
              onChange={onChange}
              className="border rounded px-2 py-1 w-full"
              disabled={submitting}
              type="url"
              placeholder="https://github.com/org/example/issues/123"
            />
          </div>
          <div className="flex flex-row gap-2 mt-2">
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
