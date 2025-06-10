'use client';

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import CopilotUserProvider from './CopilotUserProvider';
import type { User } from '@supabase/supabase-js';
import type { WeeklyPulseSubmission } from '@/types/weekly-pulse';
import { getDisplayName } from '@/lib/auth/user';
import DOMPurify from 'dompurify';


const getGreeting = (userName: string) => {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  const timeOfDay = 
    hour < 12 ? "Morning" :
    hour < 17 ? "Afternoon" :
    "Evening";
  
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];

  const greeting = 
    day === 1 ? `${timeOfDay} ${DOMPurify.sanitize(userName)}! ☕ Ready to kick off a new week? I'd love to hear what's on your mind - whether it's exciting projects ahead or just getting back into the flow.` :
    day === 5 ? `${timeOfDay} ${DOMPurify.sanitize(userName)}! 🎉 You've made it to Friday! I'm here to help wrap up the week - let's capture how things went, whether it was a week of wins or one of those 'character building' experiences.` :
    `${timeOfDay} ${DOMPurify.sanitize(userName)}! 👋 How's your ${dayName} shaping up? I'm here to listen and help you reflect on how things are going.`
    
  return greeting;
}


export default function CopilotProvider({ children, user, submissions, instructions }: { children?: React.ReactNode, user: User, submissions: WeeklyPulseSubmission[], instructions: string }) {
  const userName = DOMPurify.sanitize(getDisplayName(user));

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotUserProvider user={user} submissions={submissions}>
        {children}
        <CopilotPopup
          instructions={instructions}
          labels={{
            title: "Pulse Copilot",
            initial: getGreeting(userName)     
          }}
          defaultOpen={true}
        />
      </CopilotUserProvider>
    </CopilotKit>
  );
} 