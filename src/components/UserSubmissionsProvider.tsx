'use client';
import { useCopilotReadable } from '@copilotkit/react-core';
import React from 'react';

export default function UserSubmissionsProvider({ submissions, children }: { submissions: any[]; children: React.ReactNode }) {
  useCopilotReadable({
    value: submissions,
    description: "The current user's weekly pulse submissions history."
  });
  return <>{children}</>;
} 