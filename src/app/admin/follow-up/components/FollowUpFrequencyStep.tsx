'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

export function FollowUpFrequencyStep({
  frequency,
  setFrequency,
  days,
  setDays,
  reminderTime,
  setReminderTime,
  onSubmit,
  onBack,
  mode,
}: {
  frequency: string;
  setFrequency: React.Dispatch<React.SetStateAction<string>>;
  days: string[];
  setDays: React.Dispatch<React.SetStateAction<string[]>>;
  reminderTime: string;
  setReminderTime: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  mode: 'create' | 'edit';
}) {
  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label className="block mb-1 font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Frequency</label>
        <select className="border rounded px-2 py-1 mb-2 w-full" value={frequency} onChange={e => setFrequency(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="ad-hoc">Ad-hoc</option>
        </select>
        {frequency !== 'ad-hoc' && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Select Days</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <label key={day} className={`flex items-center gap-1 p-2 border rounded-md cursor-pointer ${days.includes(day) ? 'bg-blue-100 border-blue-400' : ''}`}>
                  <input type="checkbox" className="hidden" checked={days.includes(day)} onChange={() => setDays(d => d.includes(day) ? d.filter(x => x !== day) : [...d, day])} />
                  {day}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block mb-1 font-medium">Reminder Time</label>
        <Input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} />
      </div>
      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">{mode === 'edit' ? 'Save Changes' : 'Finish & Create'}</Button>
      </div>
    </form>
  );
} 