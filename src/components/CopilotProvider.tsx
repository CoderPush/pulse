'use client';

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import CopilotUserProvider from './CopilotUserProvider';
import type { User } from '@supabase/supabase-js';
import type { WeeklyPulseSubmission } from '@/types/weekly-pulse';
import { getDisplayName } from '@/lib/auth/user';

const COPILOT_CLOUD_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY;

export default function CopilotProvider({ children, user, submissions }: { children?: React.ReactNode, user: User, submissions: WeeklyPulseSubmission[] }) {
  if (!COPILOT_CLOUD_PUBLIC_API_KEY) {
    return <>{children}</>;
  }
  const userName = getDisplayName(user);
  return (
    <CopilotKit publicApiKey={COPILOT_CLOUD_PUBLIC_API_KEY}>
      {children}
      <CopilotUserProvider user={user} submissions={submissions}>
        <CopilotPopup
          labels={{
            title: "Pulse Copilot",
            initial: `👋 Hello ${userName}! Can I help you with your weekly pulse?`,
          }}
        />
      </CopilotUserProvider>
    </CopilotKit>
  );
} 