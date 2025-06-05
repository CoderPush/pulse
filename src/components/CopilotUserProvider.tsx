'use client';
import { useCopilotReadable } from '@copilotkit/react-core';
import React from 'react';
import type { User } from '@supabase/supabase-js';
import type { WeeklyPulseSubmission } from '@/types/weekly-pulse';
import { getDisplayName } from '@/lib/auth/user';

export default function CopilotUserProvider({
  user,
  submissions,
  children,
}: {
  user: User;
  submissions: WeeklyPulseSubmission[];
  children: React.ReactNode;
}) {
  const name = getDisplayName(user);
  const userSummary = { id: user.id, name };

  useCopilotReadable({
    value: userSummary,
    description: "The current authenticated user's id and name (name is before @ in email if not set)."
  });

  useCopilotReadable({
    value: submissions,
    description: "The current user's weekly pulse submissions history."
  });

  return <>{children}</>;
} 