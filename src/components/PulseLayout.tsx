'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import WeeklyPulseForm from '@/components/WeeklyPulseForm';
import { CopilotChat } from '@copilotkit/react-ui';
import { createWeeklyPulseFormAssistanceGuidePrompt } from '@/lib/prompt';
import { getGreeting } from '@/utils/getGreetings';
import { getDisplayName } from '@/lib/auth/user';
import { X, MessageSquare } from 'lucide-react';
import { WeeklyPulseSubmission } from '@/types/weekly-pulse';

interface PulseLayoutProps {
  user: User;
  weekNumber: number;
  currentYear: number;
  hasSubmittedThisWeek: boolean;
  projects: Array<{ id: string; name: string }>;
  previousSubmission: WeeklyPulseSubmission;
}

export default function PulseLayout({
  user,
  weekNumber,
  currentYear,
  hasSubmittedThisWeek,
  projects,
  previousSubmission
}: PulseLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const userName = getDisplayName(user);

  return (
    <div className="w-full flex">
      <div className={`transition-all duration-300 px-4 ${isChatOpen ? 'lg:w-1/2 w-full' : 'w-full'} ${isChatOpen ? 'md:block hidden' : 'block'}`}>
        <WeeklyPulseForm 
          user={user} 
          weekNumber={weekNumber} 
          currentYear={currentYear}
          hasSubmittedThisWeek={hasSubmittedThisWeek}
          projects={projects || []}
          previousSubmission={previousSubmission}        
        />
      </div>
      {isChatOpen && (
        <div className="flex flex-col h-[calc(100vh-4rem)] fixed lg:w-1/2 w-full shadow-sm border right-0 border-neutral-200 z-[100]">
          <CopilotChat
            className="h-full w-full"
            instructions={createWeeklyPulseFormAssistanceGuidePrompt()}
            labels={{
              title: "Pulse Copilot",
              initial: getGreeting(userName)     
            }}
          />
          <button 
            onClick={() => setIsChatOpen(false)}
            className="absolute top-2 right-2 z-[1000] bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      )}
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-[1000] bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
          aria-label="Open chat"
        >
          <MessageSquare size={20} />
        </button>
      )}
    </div>
  );
}