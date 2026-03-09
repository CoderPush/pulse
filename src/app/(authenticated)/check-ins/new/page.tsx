import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';
import { getActiveProjects } from '@/lib/project-checkins/queries';
import NewCheckinForm from './NewCheckinForm';

export default async function NewCheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const projects = await getActiveProjects();

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/check-ins">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Start new check-in</h1>
          <p className="text-sm text-slate-600">Select project and week</p>
        </div>
      </div>

      <NewCheckinForm projects={projects} />
    </div>
  );
}
