"use client";
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CalendarDays, Eye } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function DailyPulsePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [period, setPeriod] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [submission, setSubmission] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [monthPeriods, setMonthPeriods] = useState<any[]>([]);
  const [monthSubmissions, setMonthSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      // 1. Get current user
      const { data: { user: supaUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !supaUser) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      setUser(supaUser);

      console.log('supaUser', supaUser);
      // 2. Find today's assigned daily period for the user
      const nowStr = new Date().toISOString();
      const { data: periodUser, error: periodError } = await supabase
        .from('submission_period_users')
        .select('*, submission_periods!inner(*)')
        .eq('user_id', supaUser.id)
        .eq('submission_periods.period_type', 'daily')
        .lte('submission_periods.start_date', nowStr)
        .gte('submission_periods.end_date', nowStr)
        .single();
      
      console.log('periodUser', periodUser);
      if (periodError || !periodUser) {
        setPeriod(null);
        setLoading(false);
        return;
      }
      setPeriod(periodUser.submission_periods);
      // 3. Fetch template
      let templateData = null;
      if (periodUser && periodUser.submission_periods) {
        const { data, error } = await supabase
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
        setQuestions((questionsData || []).map((row: any) => row.questions));
      }
      // 5. Fetch submission
      if (periodUser && periodUser.submission_periods) {
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', supaUser.id)
          .eq('submission_period_id', periodUser.submission_periods.id)
          .eq('type', 'daily')
          .maybeSingle();
        setSubmission(submissionData);
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
        .eq('user_id', supaUser.id)
        .eq('submission_periods.period_type', 'daily')
        .gte('submission_periods.start_date', monthStartStr)
        .lte('submission_periods.end_date', monthEndStr);
      const periods = (allPeriodUsers || []).map((pu: any) => pu.submission_periods);
      setMonthPeriods(periods);
      // 7. Fetch all submissions for those periods
      const periodIds = periods.map((p: any) => p.id);
      let allSubmissions: any[] = [];
      if (periodIds.length > 0) {
        const { data: allSubs } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', supaUser.id)
          .eq('type', 'daily')
          .in('submission_period_id', periodIds);
        allSubmissions = allSubs || [];
      }
      setMonthSubmissions(allSubmissions);
      setLoading(false);
    };
    fetchData();
  }, []);

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
          submission_period_id: period.id,
          submitted_at: new Date().toISOString(),
          type: 'daily',
        })
        .select()
        .single();
      
      console.log('submissionError', submissionError);
      if (submissionError || !submission) {
        setSubmitError('Failed to submit check-in. Please try again.');
        setSubmitting(false);
        return;
      }
      // 2. Insert answers
      const answers = questions.map((q: any) => ({
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
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Calendar/History helpers
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  function getMonthDays(year: number, month: number) {
    const days = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }
  const monthDays = useMemo(() => getMonthDays(currentYear, currentMonth), [currentMonth, currentYear]);
  // Map date string (YYYY-MM-DD) to period and submission
  const periodByDate = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of monthPeriods) {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      for (
        let d = new Date(start);
        d <= end;
        d.setDate(d.getDate() + 1)
      ) {
        const key = d.toISOString().slice(0, 10);
        map[key] = p;
      }
    }
    return map;
  }, [monthPeriods]);
  const submissionByPeriodId = useMemo(() => {
    const map: Record<string, any> = {};
    for (const s of monthSubmissions) {
      map[s.submission_period_id] = s;
    }
    return map;
  }, [monthSubmissions]);

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
            {user ? (
              <span>If you think this is a mistake, please contact your admin.</span>
            ) : (
              <span>Please sign in to see your assignments.</span>
            )}
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
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">{user?.email?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-green-600" />
            {template?.name || 'Daily Pulse'}
          </div>
          {/* Optionally add streak/completion if you compute them from real data */}
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
              <span className="text-lg font-bold text-green-700">You haven't filled your Daily Check-in yet!</span>
              <Badge className="bg-yellow-400 text-white flex items-center gap-1"><span>⏰</span>Not Submitted</Badge>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {questions.map((q: any) => (
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
      {/* Optionally: Calendar, history, etc. can be implemented with real data as well */}
      {/* Calendar View */}
      <div className="mb-10">
        <h2 className="font-bold mb-3 text-lg text-gray-800">This Month's Check-in Overview</h2>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500 mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for first week */}
            {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
              <div key={i}></div>
            ))}
            {/* Days of month */}
            {monthDays.map((date) => {
              const day = date.getDate();
              const key = date.toISOString().slice(0, 10);
              const period = periodByDate[key];
              // Find a submission for this period where submitted_at matches this day
              let submission = null;
              if (period) {
                submission = monthSubmissions.find(
                  (s) =>
                    s.submission_period_id === period.id &&
                    new Date(s.submitted_at).toISOString().slice(0, 10) === key
                );
              }
              const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
              let status: 'submitted' | 'missed' | 'not_assigned' | 'not_submitted' = 'not_assigned';
              if (period) {
                if (submission) status = 'submitted';
                else if (date < today) status = 'missed';
                else if (isToday) status = 'not_submitted';
              }
              return (
                <div
                  key={day}
                  className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm cursor-pointer transition-all
                    ${status === 'submitted' ? 'bg-green-500 text-white' : ''}
                    ${status === 'missed' ? 'bg-red-500 text-white' : ''}
                    ${status === 'not_assigned' ? 'bg-gray-300 text-gray-500' : ''}
                    ${status === 'not_submitted' ? 'bg-yellow-400 text-white' : ''}
                    ${isToday ? 'ring-2 ring-blue-400 border-2 border-blue-400' : ''}
                    ${status === 'not_assigned' ? 'opacity-50' : 'hover:scale-110'}
                  `}
                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Submitted</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Not Submitted</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Missed</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span> Not Assigned</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-blue-400 inline-block"></span> Today</div>
          </div>
        </div>
      </div>
      {/* Table View */}
      <div>
        <h2 className="font-bold mb-3 text-lg text-gray-800">Daily Pulse History (This Month)</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Check-in</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {monthDays.map((date) => {
                const key = date.toISOString().slice(0, 10);
                const period = periodByDate[key];
                // Find a submission for this period where submitted_at matches this day
                let submission = null;
                if (period) {
                  submission = monthSubmissions.find(
                    (s) =>
                      s.submission_period_id === period.id &&
                      new Date(s.submitted_at).toISOString().slice(0, 10) === key
                  );
                }
                let status: 'submitted' | 'missed' | 'not_assigned' | 'not_submitted' = 'not_assigned';
                if (period) {
                  if (submission) status = 'submitted';
                  else if (date < today) status = 'missed';
                  else if (date.getTime() === today.getTime()) status = 'not_submitted';
                }
                return (
                  <tr key={key} className={date.getTime() === today.getTime() ? 'bg-blue-50 font-bold' : ''}>
                    <td className="px-4 py-2 whitespace-nowrap">{key}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{period ? template?.name || 'Daily Check-in' : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {status === 'submitted' && <Badge className="bg-green-500 text-white">Submitted</Badge>}
                      {status === 'missed' && <Badge className="bg-red-500 text-white">Missed</Badge>}
                      {status === 'not_submitted' && <Badge className="bg-yellow-400 text-white">Not Submitted</Badge>}
                      {status === 'not_assigned' && <Badge className="bg-gray-300 text-gray-500">Not Assigned</Badge>}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {status === 'submitted' && (
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> View
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 