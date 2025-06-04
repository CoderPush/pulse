'use client';
import { useCopilotReadable } from '@copilotkit/react-core';
import React from 'react';

export default function UserInfoProvider({ user, children }: { user: any; children: React.ReactNode }) {
  // Use name if available, otherwise use the part before '@' in email
  const name = user.name && user.name.trim() !== ''
    ? user.name
    : (user.email ? user.email.split('@')[0] : '');
  const userSummary = {
    id: user.id,
    name,
  };


  useCopilotReadable({
    value: userSummary,
    description: "The current authenticated user's id and name (name is before @ in email if not set)."
  });
  return <>{children}</>;
} 