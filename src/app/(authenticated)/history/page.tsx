import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WeekFilter } from '@/components/WeekFilter'
import { getISOWeek } from 'date-fns'

const getCurrentYear = () => new Date().getFullYear();
const getCurrentWeek = () => getISOWeek(new Date());

export default async function HistoryPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ week?: string }> 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const currentYear = getCurrentYear();
  const currentWeek = getCurrentWeek();

  // Run both queries in parallel
  const [{ data: allWeeks, error: weeksErr }, { data: submissions, error: subErr }] =
    await Promise.all([
      supabase
        .from('weeks')
        .select('year, week_number')
        .eq('year', currentYear)
        .order('week_number', { ascending: true }),
      supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', currentYear),
    ]);

  if (weeksErr || subErr) {
    console.error({ weeksErr, subErr });
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Data</h1>
          <p className="text-muted-foreground">There was an error loading your history. Please try again later.</p>
        </div>
      </div>
    );
  }

  // 3. Build a map for quick lookup
  const submissionMap = new Map();
  (submissions || []).forEach(sub => {
    submissionMap.set(sub.week_number, sub);
  });

  // 4. Prepare week options for the filter
  const weekOptions = (allWeeks || [])
    .filter(w => w.week_number <= currentWeek || w.year < currentYear)
    .map(w => ({
      value: `${w.year}-${w.week_number}`,
      label: `Week ${w.week_number}, ${w.year}`,
      week_number: w.week_number,
      year: w.year,
    }));

  // 5. Determine selected week
  const defaultWeekValue = weekOptions.find(w => w.week_number === currentWeek && w.year === currentYear)?.value || 
    (weekOptions.length > 0 ? weekOptions[weekOptions.length - 1].value : '');
  const params = await searchParams;
  const selectedWeekParam = params.week || defaultWeekValue;
  const [selectedYear, selectedWeek] = selectedWeekParam.split('-').map(Number);

  // 6. Find the week and submission
  const week = weekOptions.find(w => w.year === selectedYear && w.week_number === selectedWeek);
  const submission = submissionMap.get(selectedWeek);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weekly Pulse History</h1>
          <p className="text-muted-foreground">View your past submissions. Select a week to filter.</p>
        </div>
        <Suspense fallback={<div>Loading filter...</div>}>
          <WeekFilter weeks={weekOptions} />
        </Suspense>
      </div>
      {week ? (
        <Card className="w-full shadow-xl border-primary/10 border-2">
          <CardHeader className="border-b pb-2">
            <CardTitle className="text-xl">{week.label}</CardTitle>
          </CardHeader>
          <CardContent>
            {submission ? (
              <div>
                <div className="p-6 rounded-xl shadow-sm transition-all">
                  <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-foreground tracking-tight">{submission.primary_project_name}</span>
                      <span className="text-lg font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{submission.primary_project_hours}h</span>
                      <Badge variant={submission.status === 'submitted' ? 'secondary' : 'outline'}>
                        {submission.status}
                      </Badge>
                      {submission.is_late && <Badge variant="destructive">Late</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b border-dashed border-muted pb-2">
                      <span>Submitted: <span className="text-foreground font-medium">{new Date(submission.submitted_at).toLocaleString()}</span></span>
                      <span>Manager: <span className="text-foreground font-medium">{submission.manager}</span></span>
                      {submission.form_completion_time && (
                        <span>Time to complete: <span className="text-foreground font-medium">{submission.form_completion_time} min</span></span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1 text-primary">Additional Projects</h4>
                      {submission.additional_projects && submission.additional_projects.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          {submission.additional_projects.map((proj: { name: string; hours: number }, idx: number) => (
                            <li key={idx} className="text-sm">
                              <span className="font-medium">{proj.name}</span> — {proj.hours}h
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">None</span>
                      )}
                    </div>
                    <div className="space-y-4">
                      {submission.feedback && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1 text-primary">Feedback</h4>
                          <div className="bg-muted rounded p-2 text-sm text-foreground whitespace-pre-line border border-muted/60">{submission.feedback}</div>
                        </div>
                      )}
                      {submission.changes_next_week && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1 text-primary">Changes Next Week</h4>
                          <div className="bg-muted rounded p-2 text-sm text-foreground whitespace-pre-line border border-muted/60">{submission.changes_next_week}</div>
                        </div>
                      )}
                      {submission.milestones && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1 text-primary">Milestones</h4>
                          <div className="bg-muted rounded p-2 text-sm text-foreground whitespace-pre-line border border-muted/60">{submission.milestones}</div>
                        </div>
                      )}
                      {submission.other_feedback && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1 text-primary">Other Feedback</h4>
                          <div className="bg-muted rounded p-2 text-sm text-foreground whitespace-pre-line border border-muted/60">{submission.other_feedback}</div>
                        </div>
                      )}
                      {submission.hours_reporting_impact && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1 text-primary">Hours Reporting Impact</h4>
                          <div className="bg-muted rounded p-2 text-sm text-foreground whitespace-pre-line border border-muted/60">{submission.hours_reporting_impact}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="text-4xl mb-4">😕</span>
                <h2 className="text-xl font-semibold mb-2">No Submission</h2>
                <p className="text-muted-foreground">You have not submitted a weekly pulse for this week.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-10 pb-10">
            <p className="text-center text-muted-foreground">
              No weeks found for this year.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 