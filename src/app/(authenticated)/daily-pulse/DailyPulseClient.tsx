"use client";
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CalendarDays } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import DailyPulseCalendar from './DailyPulseCalendar';
import DailyPulseHistoryTable from './DailyPulseHistoryTable';
import { SubmissionPeriod, Submission } from './DailyPulseCalendar';

// Add Template and Question types
interface Template {
  id: string;
  name: string;
  description: string;
}
interface Question {
  id: string;
  title?: string;
  text?: string;
  type: string;
  description?: string;
  required?: boolean;
  choices?: string[];
}

export default function DailyPulseClient({ user }: { user: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<SubmissionPeriod | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [monthPeriods, setMonthPeriods] = useState<SubmissionPeriod[]>([]);
  const [monthSubmissions, setMonthSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const today = new Date();
      // 2. Find today's assigned daily period for the user
      const nowStr = new Date().toISOString();
      const { data: periodUser, error: periodError } = await supabase
        .from('submission_period_users')
        .select('*, submission_periods!inner(*)')
        .eq('user_id', user.id)
        .eq('submission_periods.period_type', 'daily')
        .lte('submission_periods.start_date', nowStr)
        .gte('submission_periods.end_date', nowStr)
        .single();
      if (periodError || !periodUser) {
        setPeriod(null);
        setLoading(false);
        return;
      }
      setPeriod(periodUser.submission_periods);
      // 3. Fetch template
      let templateData = null;
      if (periodUser && periodUser.submission_periods) {
        const { data } = await supabase
          .from('templates')
          .select('id, name, description')
          .eq('id', periodUser.submission_periods.template_id)
          .single();
        templateData = data;
        setTemplate(data);
      }
      // 4. Fetch questions
      if (templateData) {
        const { data: questionsData } = await supabase
          .from('template_questions')
          .select('question_id, questions(*)')
          .eq('template_id', templateData.id)
          .order('display_order', { ascending: true });
        setQuestions((questionsData || []).flatMap((row: { questions: Question[] }) => row.questions));
      }
      // 5. Fetch submission
      if (periodUser && periodUser.submission_periods) {
        const { data: submissionData } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('submission_period_id', periodUser.submission_periods.id)
          .eq('type', 'daily')
          .maybeSingle();
        setSubmitted(!!submissionData);
      }
      // 6. Fetch all periods for the current month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      const monthStartStr = monthStart.toISOString();
      const monthEndStr = monthEnd.toISOString();
      const { data: allPeriodUsers } = await supabase
        .from('submission_period_users')
        .select('*, submission_periods!inner(*)')
        .eq('user_id', user.id)
        .eq('submission_periods.period_type', 'daily')
        .gte('submission_periods.start_date', monthStartStr)
        .lte('submission_periods.end_date', monthEndStr);
      const periods = (allPeriodUsers || []).map((pu: { submission_periods: SubmissionPeriod }) => pu.submission_periods);
      setMonthPeriods(periods);
      // 7. Fetch all submissions for those periods
      const periodIds = periods.map((p: SubmissionPeriod) => p.id);
      let allSubmissions: Submission[] = [];
      if (periodIds.length > 0) {
        const { data: allSubs } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'daily')
          .in('submission_period_id', periodIds);
        allSubmissions = allSubs || [];
      }
      setMonthSubmissions(allSubmissions);
      setLoading(false);
    };
    fetchData();
  }, [user.id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    const supabase = createClient();
    try {
      // 1. Insert submission
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          submission_period_id: period ? period.id : undefined,
          submitted_at: new Date().toISOString(),
          type: 'daily',
        })
        .select()
        .single();
      if (submissionError || !submission) {
        setSubmitError('Failed to submit check-in. Please try again.');
        setSubmitting(false);
        return;
      }
      // 2. Insert answers
      const answers = questions.map((q: Question) => ({
        submission_id: submission.id,
        question_id: q.id,
        answer: form[q.id] || '',
      }));
      const { error: answersError } = await supabase
        .from('submission_answers')
        .insert(answers);
      if (answersError) {
        setSubmitError('Failed to save answers. Please try again.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Calendar/History helpers
  const today = new Date();
  const todayUTC = today.toISOString().slice(0, 10); // 'YYYY-MM-DD' in UTC
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  function getMonthDays(year: number, month: number) {
    const days = [];
    const date = new Date(Date.UTC(year, month, 1));
    while (date.getUTCMonth() === month) {
      days.push(new Date(date));
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return days;
  }
  const monthDays = useMemo(() => getMonthDays(currentYear, currentMonth), [currentMonth, currentYear]);
  // Map UTC date string (YYYY-MM-DD) to period and submission
  const periodByDate = useMemo(() => {
    const map: Record<string, SubmissionPeriod | undefined> = {};
    for (const p of monthPeriods) {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      for (
        let d = new Date(start);
        d <= end;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const key = d.toISOString().slice(0, 10); // UTC
        map[key] = p;
      }
    }
    return map;
  }, [monthPeriods]);

  // UI rendering
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-400 border-solid mb-4"></div>
      </div>
    );
  }
  if (error) {
    return <div className="max-w-3xl mx-auto py-8 text-center text-red-500">{error}</div>;
  }
  if (!period) {
    return (
      <div className="max-w-2xl mx-auto py-16 flex flex-col items-center justify-center text-center">
        <div className="bg-blue-50 rounded-3xl shadow-xl px-8 py-12 flex flex-col items-center w-full animate-fade-in">
          {/* Mascot/Emoji with bounce */}
          <div className="mb-2 animate-bounce-slow">
            <span className="text-6xl" role="img" aria-label="Owl">🦉</span>
          </div>
          <CalendarDays className="w-16 h-16 text-blue-400 mb-4 drop-shadow-lg animate-bounce-slow" />
          <div className="text-3xl font-extrabold text-blue-700 mb-2 tracking-tight">No Daily Check-in Today!</div>
          <div className="text-blue-800 text-base font-medium mb-2">You&apos;re all caught up. Enjoy your day! 🎉</div>
          <div className="text-muted-foreground mb-6 text-sm">
            <span>If you think this is a mistake, please contact your admin.</span>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-full font-bold px-8 py-2 bg-blue-200/60 hover:bg-blue-300/80 text-blue-900 shadow hover:scale-105 transition-all"
          >
            🔄 Refresh
          </Button>
        </div>
        <style jsx global>{`
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2.2s infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Vibrant header */}
      <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-gradient-to-r from-green-200 via-blue-200 to-cyan-200 shadow">
        <Avatar className="w-14 h-14 text-3xl font-bold">
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">{user?.id?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-green-600" />
            {template?.name || 'Daily Pulse'}
          </div>
        </div>
      </div>
      {/* Daily Check-in Fill Form */}
      {!submitted && (
        <Card className="mb-8 border-green-400 shadow-lg">
          <CardContent className="py-6">
            {submitError && (
              <div className="mb-4 text-red-500 text-sm font-semibold text-center">{submitError}</div>
            )}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-lg font-bold text-green-700">You haven&apos;t filled your Daily Check-in yet!</span>
              <Badge className="bg-yellow-400 text-white flex items-center gap-1"><span>⏰</span>Not Submitted</Badge>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {questions.map((q: Question) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium mb-1 text-gray-700">{q.title}</label>
                  {q.type === 'textarea' ? (
                    <Textarea name={q.id} value={form[q.id] || ''} onChange={handleChange} required={q.required} placeholder={q.description} disabled={submitting} />
                  ) : (
                    <Input name={q.id} value={form[q.id] || ''} onChange={handleChange} required={q.required} placeholder={q.description} disabled={submitting} />
                  )}
                </div>
              ))}
              <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white w-full mt-2" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Daily Check-in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      {submitted && (
        <Card className="mb-8 border-green-400 shadow-lg">
          <CardContent className="py-6 flex items-center gap-3">
            <span className="text-lg font-bold text-green-700">✅ Daily Check-in submitted! Have a great day!</span>
          </CardContent>
        </Card>
      )}
      {/* Calendar View */}
      <DailyPulseCalendar
        monthDays={monthDays}
        periodByDate={periodByDate}
        monthSubmissions={monthSubmissions}
        todayUTC={todayUTC}
      />
      {/* Table View */}
      <DailyPulseHistoryTable
        monthDays={monthDays}
        periodByDate={periodByDate}
        monthSubmissions={monthSubmissions}
        todayUTC={todayUTC}
        template={template || { id: '', name: '', description: '' }}
      />
    </div>
  );
} 