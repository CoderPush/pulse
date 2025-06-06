'use client';

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import CopilotUserProvider from './CopilotUserProvider';
import type { User } from '@supabase/supabase-js';
import type { WeeklyPulseSubmission } from '@/types/weekly-pulse';
import { getDisplayName } from '@/lib/auth/user';
import { createMainPrompt } from "@/lib/prompt";

const COPILOT_CLOUD_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY;

export default function CopilotProvider({ children, user, submissions }: { children?: React.ReactNode, user: User, submissions: WeeklyPulseSubmission[] }) {
  if (!COPILOT_CLOUD_PUBLIC_API_KEY) {
    return <>{children}</>;
  }
  const userName = getDisplayName(user);
  const getGreeting = () => {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    const timeOfDay = 
      hour < 12 ? "Morning" :
      hour < 17 ? "Afternoon" :
      "Evening";
      
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
    
    const greeting = 
      day === 1 ? `${timeOfDay} ${userName}! ☕ Ready to kick off a new week? I'd love to hear what's on your mind - whether it's exciting projects ahead or just getting back into the flow.` :
      day === 5 ? `${timeOfDay} ${userName}! 🎉 You've made it to Friday! I'm here to help wrap up the week - let's capture how things went, whether it was a week of wins or one of those 'character building' experiences.` :
      `${timeOfDay} ${userName}! 👋 How's your ${dayName} shaping up? I'm here to listen and help you reflect on how things are going.`
      
    return greeting;
  }
  return (
    <CopilotKit publicApiKey={COPILOT_CLOUD_PUBLIC_API_KEY}>
      <CopilotUserProvider user={user} submissions={submissions}>
        {children}
        <CopilotPopup
          instructions={createMainPrompt(submissions, user)}
          labels={{
            title: "Pulse Copilot",
            initial: getGreeting()     
          }}
          defaultOpen={true}
        />
      </CopilotUserProvider>
    </CopilotKit>
  );
} 