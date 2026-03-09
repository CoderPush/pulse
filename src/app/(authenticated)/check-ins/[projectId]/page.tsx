import Link from 'next/link';

import { getISOWeek } from 'date-fns/getISOWeek';
import { getISOWeekYear } from 'date-fns/getISOWeekYear';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/server';
import { getProjectCheckinPageData } from '@/lib/project-checkins/queries';
import ProjectCheckinSession from '../components/ProjectCheckinSession';

type ProjectCheckinProjectPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ year?: string; week?: string }>;
};

function parseYearWeek(searchYear?: string, searchWeek?: string): { year: number; weekNumber: number } {
  const now = new Date();
  const year = searchYear ? parseInt(searchYear, 10) : getISOWeekYear(now);
  const weekNumber = searchWeek ? parseInt(searchWeek, 10) : getISOWeek(now);
  if (Number.isNaN(year) || Number.isNaN(weekNumber)) {
    return { year: getISOWeekYear(now), weekNumber: getISOWeek(now) };
  }
  return {
    year: year >= 2000 && year <= 2100 ? year : getISOWeekYear(now),
    weekNumber: weekNumber >= 1 && weekNumber <= 53 ? weekNumber : getISOWeek(now),
  };
}

export default async function ProjectCheckinProjectPage({ params, searchParams }: ProjectCheckinProjectPageProps) {
  const { projectId } = await params;
  const { year: searchYear, week: searchWeek } = await searchParams;
  const { year, weekNumber } = parseYearWeek(searchYear, searchWeek);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const data = await getProjectCheckinPageData(user.id, projectId, year, weekNumber);

  if (!data.project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Project not found</CardTitle>
            <CardDescription>
              This project does not exist or is not available for check-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/check-ins">Back to check-ins</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/check-ins/new">Start new check-in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <ProjectCheckinSession
        project={data.project}
        year={year}
        weekNumber={weekNumber}
        definitions={data.definitions}
        previousResponsesByMetric={data.previousResponsesByMetric}
        currentSubmission={data.currentSubmission}
        currentResponses={data.currentResponses}
      />
    </div>
  );
}
