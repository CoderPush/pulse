import { NextResponse } from 'next/server';
import { isFormOpen, getTimeUntilNextWindow } from '@/lib/utils/time';

export async function GET() {
  const open = isFormOpen();
  const timeUntilNextWindow = getTimeUntilNextWindow();

  return NextResponse.json({
    open,
    timeUntilNextWindow,
    message: open 
      ? 'Form is currently open for submissions'
      : 'Form is currently closed',
  });
} 