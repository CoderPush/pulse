'use client';

import { ArrowRight } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { signOut } from '@/utils/actions';

interface WelcomeScreenProps {
  user: User;
  onNext: () => void;
  weekNumber: number;
}

export default function WelcomeScreen({ onNext, user, weekNumber }: WelcomeScreenProps) {
  const name = user?.email || 'there';
  const year = new Date().getFullYear();

  // Format date range for the week
  const getWeekDates = (weekNum: number) => {
    const startDate = new Date(year, 0, 1 + (weekNum - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    return {
      start: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  };

  const weekDates = getWeekDates(weekNumber);

  return (
    <div className="flex flex-col items-center justify-center text-center h-full gap-8 px-6">
      <div className="text-6xl">👋</div>
      <div>
        <h1 className="text-2xl font-bold mb-2">Hi, {name}!</h1>
        <p className="text-gray-600 mb-2">This is your Weekly Pulse for</p>
        <p className="text-xl font-semibold mb-2">Week {weekNumber}</p>
        <p className="text-sm text-gray-500 mb-6">{weekDates.start} - {weekDates.end}</p>
        <p className="text-gray-600">Ready? Let&apos;s go</p>
      </div>
      <div className="flex flex-col gap-4">
        <button 
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium flex items-center gap-2 transition-all transform hover:scale-105 cursor-pointer"
        >
          Start <ArrowRight size={18} />
        </button>
        <form action={signOut}>
          <button 
            type="submit"
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-medium transition-all transform hover:scale-105 cursor-pointer"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
} 