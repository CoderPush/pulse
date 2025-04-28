'use client';

import { ArrowRight } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';
import { User } from '@supabase/supabase-js';
import { signOut } from '@/utils/actions';

interface WelcomeScreenProps extends Pick<ScreenProps, 'onNext'> {
  user: User | null;
}

export default function WelcomeScreen({ onNext, user }: WelcomeScreenProps) {
  const name = user?.email || 'there';

  return (
    <div className="flex flex-col items-center justify-center text-center h-full gap-8 px-6">
      <div className="text-6xl">👋</div>
      <div>
        <h1 className="text-2xl font-bold mb-2">Hi, {name}!</h1>
        <p className="text-gray-600 mb-6">This is your Weekly Pulse for <span className="font-semibold">Week 17</span></p>
        <p className="text-gray-600">Ready? Let&apos;s go</p>
      </div>
      <div className="flex flex-col gap-4">
        <button 
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium flex items-center gap-2 transition-all transform hover:scale-105"
        >
          Start <ArrowRight size={18} />
        </button>
        <form action={signOut}>
          <button 
            type="submit"
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-medium transition-all transform hover:scale-105"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
} 