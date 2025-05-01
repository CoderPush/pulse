'use client';

import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { getWeekDates, getSubmissionWindow } from '@/lib/utils/date';

interface WelcomeScreenProps {
  user: User;
  onNext: () => void;
  weekNumber: number;
}

export default function WelcomeScreen({ user, onNext, weekNumber }: WelcomeScreenProps) {
  const { formattedRange } = getWeekDates(weekNumber);
  const { formattedWindows } = getSubmissionWindow(weekNumber);

  return (
    <div className="px-8 flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-6">Welcome back, {user.email}!</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Week {weekNumber}</h2>
        <p className="text-gray-600">{formattedRange.start} - {formattedRange.end}</p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg mb-8 w-full">
        <h3 className="font-semibold mb-2">Submission Window</h3>
        <p className="text-sm text-gray-600 mb-1">Opens: {formattedWindows.start}</p>
        <p className="text-sm text-gray-600 mb-1">Due by: {formattedWindows.end}</p>
        <p className="text-sm text-gray-600">Late submissions until: {formattedWindows.lateEnd}</p>
      </div>

      <Button onClick={onNext} className="w-full">
        Start Weekly Pulse
      </Button>
    </div>
  );
} 