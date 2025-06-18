'use client';
import { useCopilotReadable } from '@copilotkit/react-core';
import React from 'react';
import type { User } from '@supabase/supabase-js';
import { getDisplayName } from '@/lib/auth/user';

export default function CopilotUserProvider({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const name = getDisplayName(user);
  const userSummary = { id: user.id, name };

  useCopilotReadable({
    value: userSummary,
    description: "The current authenticated user's id and name (name is before @ in email if not set)."
  });

  return <>{children}</>;
} 