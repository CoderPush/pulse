'use client';

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import CopilotUserProvider from './CopilotUserProvider';
import type { User } from '@supabase/supabase-js';

export default function CopilotProvider({ children, user }: { children?: React.ReactNode, user: User }) {

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotUserProvider user={user}>
        {children}
      </CopilotUserProvider>
    </CopilotKit>
  );
} 