'use client';
import { useCopilotReadable } from '@copilotkit/react-core';
import { WeeklyPulseSubmission } from '@/types/weekly-pulse';
import React from 'react';

export default function UserSubmissionsProvider({ submissions, children }: { submissions:  WeeklyPulseSubmission[]; children: React.ReactNode }) {
  useCopilotReadable({
    value: submissions,
    description: "The current user's weekly pulse submissions history."
  });
  return <>{children}</>;
} 