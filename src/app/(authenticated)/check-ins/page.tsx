import Link from 'next/link';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';
import {
  getProjectCheckinHistory,
  getProjectCheckinMetricDefinitions,
} from '@/lib/project-checkins/queries';
import ProjectCheckinHistoryList from './components/ProjectCheckinHistoryList';

export default async function ProjectCheckinsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [entries, definitions] = await Promise.all([
    getProjectCheckinHistory(user.id),
    getProjectCheckinMetricDefinitions(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Project check-ins</p>
          <h1 className="text-3xl font-semibold text-slate-950">Weekly project health</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Your check-in history and metric scores. Start a new check-in for any project and week.
          </p>
        </div>
        <Button asChild>
          <Link href="/check-ins/new">
            <Plus className="mr-2 h-4 w-4" />
            Start new check-in
          </Link>
        </Button>
      </div>

      <ProjectCheckinHistoryList entries={entries} definitions={definitions} />
    </div>
  );
}
