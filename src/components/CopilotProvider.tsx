'use client';

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

const COPILOT_CLOUD_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY;

export default function CopilotProvider({ children, userName }: { children: React.ReactNode, userName: string }) {
  return (
    <CopilotKit publicApiKey={COPILOT_CLOUD_PUBLIC_API_KEY}>
      {children}
      <CopilotPopup
        labels={{
          title: "Pulse Copilot",
          initial: `👋 Hello ${userName}! Can I help you with your weekly pulse?`,
        }}
      />
    </CopilotKit>
  );
} 