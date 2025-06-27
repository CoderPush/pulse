import { createClient } from '@/utils/supabase/server';
import DailyPulseClient from './components/DailyPulseClient';

export default async function DailyPulsePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="max-w-3xl mx-auto py-8 text-center text-red-500">Please sign in to view your daily pulse.</div>;
  }

  return <DailyPulseClient user={user} />;
} 