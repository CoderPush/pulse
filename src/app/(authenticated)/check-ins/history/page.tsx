import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';
import {
  getProjectCheckinHistory,
  getProjectCheckinMetricDefinitions,
} from '@/lib/project-checkins/queries';
import ProjectCheckinHistoryList from '../components/ProjectCheckinHistoryList';

export default async function ProjectCheckinHistoryPage() {
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
          <p className="text-sm font-medium text-slate-500">Project metric check-ins</p>
          <h1 className="text-3xl font-semibold text-slate-950">History</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Review your recent project check-ins, including metric scores, tags, and notes.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/check-ins">Back to check-ins</Link>
        </Button>
      </div>

      <ProjectCheckinHistoryList entries={entries} definitions={definitions} />
    </div>
  );
}
