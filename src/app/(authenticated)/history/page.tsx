import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeekFilter } from "@/components/WeekFilter";
import { getMostRecentThursdayWeek } from "@/lib/utils/date";
import {
  Calendar,
  AlertCircle,
  CalendarX,
  Star,
  Book,
  User,
  Clock,
} from "lucide-react";
import StreakCard from "./StreakCard";
import SubmissionComments from "@/components/SubmissionComments";
import { START_WEEK, isWeekExcluded } from "@/utils/streak";
import ProjectLineChart from "@/components/ProjectLineChart";

type SubmissionAnswerWithQuestion = {
  id: string;
  question_id: string;
  answer: string | string[];
  question_title: string;
  question_description: string;
  question_type: string;
  question_required: boolean;
  question_category: string;
};

const getCurrentYear = () => new Date().getFullYear();
const getCurrentWeek = () => getMostRecentThursdayWeek();

function calculateStreak(
  submissions: { week_number: number }[],
  allWeeks: { week_number: number }[],
  currentWeek: number
) {
  const submittedWeeks = new Set(submissions.map((s) => s.week_number));
  // Only consider weeks up to and including currentWeek
  const sortedWeeks = allWeeks
    .filter((w) => w.week_number <= currentWeek)
    .sort((a, b) => b.week_number - a.week_number); // descending from currentWeek

  let streak = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    const weekNum = sortedWeeks[i].week_number;
    if (submittedWeeks.has(weekNum)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

interface HistoryPageParams {
  week?: string;
  year?: string;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<HistoryPageParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const currentYear = getCurrentYear();
  const currentWeek = getCurrentWeek();

  // Fetch submissions and weeks data
  const [
    { data: allWeeks, error: weeksErr },
    { data: submissions, error: subErr },
  ] = await Promise.all([
    supabase
      .from("weeks")
      .select("year, week_number, start_date, end_date")
      .eq("year", currentYear)
      .order("week_number", { ascending: true }),
    supabase
      .from("submissions")
      .select("*")
      .eq("user_id", user.id)
      .eq("year", currentYear),
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
            <p className="text-muted-foreground">
              There was an error loading your history. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build a map for quick lookup
  const submissionMap = new Map();
  (submissions || []).forEach((sub) => {
    submissionMap.set(sub.week_number, sub);
  });

  // Filter out excluded weeks from allWeeks for streak calculation
  const filteredWeeks = (allWeeks || []).filter(
    (w) => !isWeekExcluded(w.year, w.week_number)
  );

  // Prepare week options for the filter
  const weekOptions = filteredWeeks
    .filter((w) => w.week_number <= currentWeek || w.year < currentYear)
    .map((w) => ({
      value: `${w.year}-${w.week_number}`,
      label: `Week ${w.week_number}, ${w.year}`,
      week_number: w.week_number,
      year: w.year,
    }))
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week_number - a.week_number;
    });

  // Determine selected week
  const defaultWeekValue =
    weekOptions.find(
      (w) => w.week_number === currentWeek && w.year === currentYear
    )?.value ||
    (weekOptions.length > 0 ? weekOptions[weekOptions.length - 1].value : "");
  const selectedWeek = params.week
    ? Number(params.week)
    : Number((defaultWeekValue || "").split("-")[1]);
  const selectedYear = params.year
    ? Number(params.year)
    : Number((defaultWeekValue || "").split("-")[0]);

  // Find the week and submission
  const week = weekOptions.find(
    (w) => w.year === selectedYear && w.week_number === selectedWeek
  );
  const submission = submissionMap.get(selectedWeek);

  // Fetch dynamic answers for the selected submission using the RPC
  let dynamicAnswers: SubmissionAnswerWithQuestion[] = [];
  if (submission) {
    const { data: answers, error } = await supabase.rpc(
      "get_submission_answers",
      { submission_id: submission.id }
    );
    if (!error && answers) {
      dynamicAnswers = answers as SubmissionAnswerWithQuestion[];
    }
  }

  // Calculate streak
  const streak = calculateStreak(submissions || [], filteredWeeks, currentWeek);

  type ChartDataPoint = {
    week: number;
    [projectName: string]: number | string;
  };
  let chartData: ChartDataPoint[] = [];
  if (submissions && submissions.length > 0) {
    const allProjectNames = new Set<string>();
    const rawWeekMap = new Map<number, Record<string, number>>();
    for (const sub of submissions) {
      const week = sub.week_number;
      if (!rawWeekMap.has(week)) rawWeekMap.set(week, {});
      const current = rawWeekMap.get(week)!;
      const primaryName = sub.primary_project_name;
      allProjectNames.add(primaryName);
      current[primaryName] =
        (current[primaryName] || 0) + sub.primary_project_hours;
      for (const additional of sub.additional_projects ?? []) {
        const additionalName = additional.name;
        allProjectNames.add(additionalName);
        current[additionalName] =
          (current[additionalName] || 0) + additional.hours;
      }
    }
    chartData = Array.from(rawWeekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([week, projects]) => {
        const fullWeekData: ChartDataPoint = { week };
        for (const name of allProjectNames) {
          fullWeekData[name] = projects[name] ?? 0;
        }
        return fullWeekData;
      });
  }

  // Build week meta map for tooltips
  const weekMeta: Record<number, { start_date: string; end_date: string }> = {};
  (allWeeks || []).forEach((w) => {
    weekMeta[w.week_number] = {
      start_date: w.start_date,
      end_date: w.end_date,
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Weeks Streak Section */}
      <StreakCard
        streak={streak}
        allWeeks={filteredWeeks.filter((w) => w.week_number >= START_WEEK)}
        submissions={submissions || []}
        currentWeek={currentWeek}
        currentYear={currentYear}
      />
      {/* ProjectLineChart Visualization */}
      {chartData.length > 0 && (
        <ProjectLineChart data={chartData} weekMeta={weekMeta} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Weekly Pulse History</h1>
          <p className="text-muted-foreground">
            View your past submissions and track your progress
          </p>
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
                <CardTitle className="text-xl text-blue-700 dark:text-blue-300">
                  {week.label}
                </CardTitle>
              </div>
              {submission && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                    {submission.status}
                  </Badge>
                  {submission.is_late && (
                    <Badge variant="destructive">Late</Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {submission ? (
              <div className="space-y-6">
                {/* Primary Project Card with Accent Bar and Right-Aligned Badge */}
                <div className="relative flex items-center bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl shadow-xl border-l-8 border-sky-400 p-6 mb-4 overflow-visible">
                  <Star className="w-7 h-7 text-sky-400 mr-4" />
                  <div className="flex-1 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-blue-900 mb-0">
                      {submission.primary_project_name}
                    </h3>
                    <span className="bg-yellow-300 text-blue-900 rounded-full px-4 py-2 font-bold shadow ml-2">
                      {submission.primary_project_hours}h
                    </span>
                  </div>
                </div>

                {/* Additional Projects */}
                {submission.additional_projects &&
                  submission.additional_projects.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-200">
                        <Book className="w-5 h-5 text-amber-400 dark:text-amber-200" />
                        Additional Projects
                      </h4>
                      <div className="grid gap-4">
                        {submission.additional_projects.map(
                          (
                            proj: { name: string; hours: number },
                            idx: number
                          ) => (
                            <div
                              key={idx}
                              className="relative flex items-center bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl shadow-xl border-l-8 border-amber-400 p-6 overflow-visible"
                            >
                              <Book className="w-6 h-6 text-amber-400 mr-4" />
                              <div className="flex-1 flex items-center justify-between">
                                <span className="font-bold text-amber-800 text-base mb-0">
                                  {proj.name}
                                </span>
                                <span className="bg-sky-200 text-amber-900 rounded-full px-4 py-2 font-bold shadow ml-2">
                                  {proj.hours}h
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Submission Meta Info - Simple Layout */}
                <div className="grid gap-2 mt-8">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">Submitted:</span>
                    <span>
                      {new Date(submission.submitted_at).toLocaleString(
                        undefined,
                        { timeZoneName: "short" }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200 text-sm">
                    <User className="w-4 h-4" />
                    <span className="font-semibold">Manager:</span>
                    <span>{submission.manager}</span>
                  </div>
                  {submission.form_completion_time && (
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200 text-sm">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">Time to complete:</span>
                      <span>{submission.form_completion_time} min</span>
                    </div>
                  )}
                </div>

                {/* Feedback and Notes */}
                <div className="grid gap-4 md:grid-cols-2">
                  {submission.feedback && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">
                        Feedback
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.feedback}
                      </div>
                    </div>
                  )}
                  {submission.changes_next_week && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">
                        Changes Next Week
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.changes_next_week}
                      </div>
                    </div>
                  )}
                  {submission.milestones && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">
                        Milestones
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.milestones}
                      </div>
                    </div>
                  )}
                  {submission.other_feedback && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">
                        Other Feedback
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.other_feedback}
                      </div>
                    </div>
                  )}
                  {submission.hours_reporting_impact && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">
                        Hours Reporting Impact
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                        {submission.hours_reporting_impact}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Questions & Answers */}
                {dynamicAnswers.length > 0 && (
                  <div>
                    {dynamicAnswers.map((a) => (
                      <div key={a.question_id}>
                        <h4 className="font-semibold text-sm mb-2 text-primary">
                          {a.question_title}
                        </h4>
                        {Array.isArray(a.answer) ? (
                          <div className="flex flex-wrap gap-2 bg-muted/30 rounded-lg p-3">
                            {a.answer.map((val: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200"
                              >
                                {val}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                            {a.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {submission && submission.id && (
                  <SubmissionComments
                    submissionId={submission.id}
                    currentUserId={user.id}
                  />
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 bg-muted/40 border-0 shadow-none">
                  <CalendarX className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    No Submission Yet
                  </h2>
                  <p className="text-muted-foreground mb-4 text-center max-w-xs">
                    You haven&apos;t submitted your weekly pulse for this week.
                    <br />
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
