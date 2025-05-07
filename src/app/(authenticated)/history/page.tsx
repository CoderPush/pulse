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
import { getMostRecentThursdayWeek } from '@/lib/utils/date'
import { Calendar, AlertCircle, CalendarX } from 'lucide-react'

const getCurrentYear = () => new Date().getFullYear();
const getCurrentWeek = () => getMostRecentThursdayWeek();

export default async function HistoryPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ week?: string }> 
}) {
  const params = await searchParams;
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
      <div className="max-w-4xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Error Loading Data</h2>
            </div>
            <p className="text-muted-foreground">There was an error loading your history. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build a map for quick lookup
  const submissionMap = new Map();
  (submissions || []).forEach(sub => {
    submissionMap.set(sub.week_number, sub);
  });

  // Prepare week options for the filter
  const weekOptions = (allWeeks || [])
    .filter(w => w.week_number <= currentWeek || w.year < currentYear)
    .map(w => ({
      value: `${w.year}-${w.week_number}`,
      label: `Week ${w.week_number}, ${w.year}`,
      week_number: w.week_number,
      year: w.year,
    }));

  // Determine selected week
  const defaultWeekValue = weekOptions.find(w => w.week_number === currentWeek && w.year === currentYear)?.value || 
    (weekOptions.length > 0 ? weekOptions[weekOptions.length - 1].value : '');
  const selectedWeekParam = params.week || defaultWeekValue;
  const [selectedYear, selectedWeek] = selectedWeekParam.split('-').map(Number);

  // Find the week and submission
  const week = weekOptions.find(w => w.year === selectedYear && w.week_number === selectedWeek);
  const submission = submissionMap.get(selectedWeek);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Weekly Pulse History</h1>
          <p className="text-muted-foreground">View your past submissions and track your progress</p>
        </div>
        <Suspense fallback={<div>Loading filter...</div>}>
          <WeekFilter weeks={weekOptions} />
        </Suspense>
      </div>

      {week ? (
        <Card className="w-full shadow-lg border-primary/10">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                <CardTitle className="text-xl text-blue-700 dark:text-blue-300">{week.label}</CardTitle>
              </div>
              {submission && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                    {submission.status}
                  </Badge>
                  {submission.is_late && <Badge variant="destructive">Late</Badge>}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {submission ? (
              <div className="space-y-6">
                {/* Primary Project */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{submission.primary_project_name}</h3>
                      <p className="text-muted-foreground">Primary Project</p>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-1">
                      {submission.primary_project_hours}h
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Submitted:</span> {new Date(submission.submitted_at).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Manager:</span> {submission.manager}
                    </div>
                    {submission.form_completion_time && (
                      <div>
                        <span className="font-medium">Time to complete:</span> {submission.form_completion_time} min
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Projects */}
                {submission.additional_projects && submission.additional_projects.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-primary">Additional Projects</h4>
                    <div className="grid gap-3">
                      {submission.additional_projects.map((proj: { name: string; hours: number }, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                          <span className="font-medium">{proj.name}</span>
                          <Badge variant="outline">{proj.hours}h</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback and Notes */}
                <div className="grid gap-4 md:grid-cols-2">
                  {submission.feedback && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">Feedback</h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.feedback}
                      </div>
                    </div>
                  )}
                  {submission.changes_next_week && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">Changes Next Week</h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.changes_next_week}
                      </div>
                    </div>
                  )}
                  {submission.milestones && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">Milestones</h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.milestones}
                      </div>
                    </div>
                  )}
                  {submission.other_feedback && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">Other Feedback</h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.other_feedback}
                      </div>
                    </div>
                  )}
                  {submission.hours_reporting_impact && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">Hours Reporting Impact</h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.hours_reporting_impact}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 bg-muted/40 border-0 shadow-none">
                  <CalendarX className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Submission Yet</h2>
                  <p className="text-muted-foreground mb-4 text-center max-w-xs">
                    You haven&apos;t submitted your weekly pulse for this week.<br />
                  </p>
                </CardContent>
              </Card>
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