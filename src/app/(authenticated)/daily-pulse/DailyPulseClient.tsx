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

// Add DailyPeriodForm type for todayPeriods state
interface DailyPeriodForm {
  period: SubmissionPeriod;
  template: Template | null;
  questions: Question[];
  submission: Submission | null;
  form: Record<string, string | string[]>;
  submitted: boolean;
  submitting: boolean;
  submitError: string | null;
}

function DailyPulseQuestionField({ q, value, onChange, submitting }: {
  q: Question;
  value: string | string[] | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | string[]; type: string; checked?: boolean } }) => void;
  submitting: boolean;
}) {
  if (q.type === 'textarea') {
    return (
      <Textarea
        name={q.id}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        required={q.required}
        placeholder={q.description}
        disabled={submitting}
      />
    );
  } else if (q.type === 'multiple_choice' && q.choices) {
    return (
      <div className="flex flex-col gap-2">
        {q.choices.map((choice) => (
          <label key={choice} className="flex items-center gap-2">
            <input
              type="radio"
              name={q.id}
              value={choice}
              checked={value === choice}
              onChange={onChange}
              required={q.required}
              disabled={submitting}
            />
            {choice}
          </label>
        ))}
      </div>
    );
  } else if (q.type === 'checkbox' && q.choices) {
    return (
      <div className="flex flex-col gap-2">
        {q.choices.map((choice) => (
          <label key={choice} className="flex items-center gap-2">
            <input
              type="checkbox"
              name={q.id}
              value={choice}
              checked={Array.isArray(value) ? value.includes(choice) : false}
              onChange={e => {
                const prev = Array.isArray(value) ? value : [];
                if (e.target.checked) {
                  onChange({ target: { name: q.id, value: [...prev, choice], type: 'checkbox', checked: true } });
                } else {
                  onChange({ target: { name: q.id, value: prev.filter((c: string) => c !== choice), type: 'checkbox', checked: false } });
                }
              }}
              disabled={submitting}
            />
            {choice}
          </label>
        ))}
      </div>
    );
  } else {
    return (
      <Input
        name={q.id}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        required={q.required}
        placeholder={q.description}
        disabled={submitting}
      />
    );
  }
}

export default function DailyPulseClient({ user }: { user: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayPeriods, setTodayPeriods] = useState<DailyPeriodForm[]>([]); // Array of { period, template, questions, submission, form, submitted, submitting, submitError }
  const [monthPeriods, setMonthPeriods] = useState<SubmissionPeriod[]>([]);
  const [monthSubmissions, setMonthSubmissions] = useState<Submission[]>([]);
  const [monthTemplates, setMonthTemplates] = useState<Record<string, Template>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const today = new Date();
      const nowStr = new Date().toISOString();
      // 1. Fetch all periods for today
      const { data: periodUsers, error: periodError } = await supabase
        .from('submission_period_users')
        .select('*, submission_periods!inner(*)')
        .eq('user_id', user.id)
        .eq('submission_periods.period_type', 'daily')
        .lte('submission_periods.start_date', nowStr)
        .gte('submission_periods.end_date', nowStr);
      if (periodError) {
        setError(periodError.message);
        setLoading(false);
        return;
      }
      // 2. For each period, fetch template, questions, and submission
      const periodForms = await Promise.all((periodUsers || []).map(async (pu: { submission_periods: SubmissionPeriod }) => {
        const period = pu.submission_periods;
        // Fetch template
        const { data: template } = await supabase
          .from('templates')
          .select('id, name, description')
          .eq('id', period.template_id)
          .single();
        // Fetch questions
        let questions: Question[] = [];
        if (template) {
          const { data: questionsData } = await supabase
            .from('template_questions')
            .select('question_id, questions(*)')
            .eq('template_id', template.id)
            .order('display_order', { ascending: true });
          questions = (questionsData || []).flatMap((row: { questions: Question[] }) => row.questions);
        }
        // Fetch submission
        const { data: submissionData } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('submission_period_id', period.id)
          .eq('type', 'daily')
          .maybeSingle();
        return {
          period,
          template,
          questions,
          submission: submissionData,
          form: {},
          submitted: !!submissionData,
          submitting: false,
          submitError: null,
        };
      }));
      setTodayPeriods(periodForms);
      // 3. Fetch all periods for the current month (for calendar/history)
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
      // Fetch all templates for these periods
      const templateIds = Array.from(new Set(periods.map((p: SubmissionPeriod) => p.template_id)));
      const templateMap: Record<string, Template> = {};
      if (templateIds.length > 0) {
        const { data: templatesData } = await supabase
          .from('templates')
          .select('id, name, description')
          .in('id', templateIds);
        (templatesData || []).forEach((t: Template) => {
          templateMap[t.id] = t;
        });
      }
      setMonthTemplates(templateMap);
      // 4. Fetch all submissions for those periods
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

  // Handler for submitting a form for a specific period
  async function handleSubmit(idx: number, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTodayPeriods(prev => prev.map((f, i) => i === idx ? { ...f, submitting: true, submitError: null } : f));
    const supabase = createClient();
    const form = todayPeriods[idx].form;
    const period = todayPeriods[idx].period;
    const questions = todayPeriods[idx].questions;
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
      if (submissionError || !submission) {
        setTodayPeriods(prev => prev.map((f, i) => i === idx ? { ...f, submitting: false, submitError: 'Failed to submit check-in. Please try again.' } : f));
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
        setTodayPeriods(prev => prev.map((f, i) => i === idx ? { ...f, submitting: false, submitError: 'Failed to save answers. Please try again.' } : f));
        return;
      }
      setTodayPeriods(prev => prev.map((f, i) => i === idx ? { ...f, submitted: true, submitting: false } : f));
    } catch {
      setTodayPeriods(prev => prev.map((f, i) => i === idx ? { ...f, submitting: false, submitError: 'Something went wrong. Please try again.' } : f));
    }
  }

  // Handler for form field change
  function handleChange(idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    let checked = false;
    if (type === 'checkbox' && 'checked' in e.target) {
      checked = (e.target as HTMLInputElement).checked;
    }
    setTodayPeriods(prev => prev.map((f, i) => {
      if (i !== idx) return f;
      const newForm = { ...f.form };
      if (type === 'checkbox') {
        const prevArr = Array.isArray(newForm[name]) ? newForm[name] as string[] : [];
        if (checked) {
          newForm[name] = [...prevArr, value];
        } else {
          newForm[name] = prevArr.filter((v: string) => v !== value);
        }
      } else {
        newForm[name] = value;
      }
      return { ...f, form: newForm };
    }));
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
  // Map UTC date string (YYYY-MM-DD) to array of periods
  const periodByDate = useMemo(() => {
    const map: Record<string, SubmissionPeriod[]> = {};
    for (const p of monthPeriods) {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      for (
        let d = new Date(start);
        d < end;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const key = d.toISOString().slice(0, 10); // UTC
        if (!map[key]) map[key] = [];
        map[key].push(p);
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
  if (!todayPeriods.length) {
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
            Daily Pulse
          </div>
        </div>
      </div>
      {/* Daily Check-in Fill Forms */}
      {todayPeriods.map((f, idx) => (
        <Card key={f.period.id} className="mb-8 border-green-400 shadow-lg">
          <CardContent className="py-6">
            {f.submitError && (
              <div className="mb-4 text-red-500 text-sm font-semibold text-center">{f.submitError}</div>
            )}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-lg font-bold text-green-700">{f.template?.name || 'Daily Check-in'} {!f.submitted && 'needs your response!'}</span>
              {!f.submitted && <Badge className="bg-yellow-400 text-white flex items-center gap-1"><span>⏰</span>Not Submitted</Badge>}
              {f.submitted && <Badge className="bg-green-500 text-white flex items-center gap-1"><span>✅</span>Submitted</Badge>}
            </div>
            {!f.submitted && (
              <form className="space-y-4" onSubmit={e => handleSubmit(idx, e)}>
                {f.questions.map((q: Question) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{q.title}</label>
                    <DailyPulseQuestionField
                      q={q}
                      value={f.form[q.id]}
                      submitting={f.submitting}
                      onChange={e => handleChange(idx, e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)}
                    />
                  </div>
                ))}
                <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white w-full mt-2" disabled={f.submitting}>
                  {f.submitting ? 'Submitting...' : 'Submit Daily Check-in'}
                </Button>
              </form>
            )}
            {f.submitted && (
              <div className="text-green-700 font-semibold text-center py-4">✅ Daily Check-in submitted! Have a great day!</div>
            )}
          </CardContent>
        </Card>
      ))}
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
        templateMap={monthTemplates}
        questions={todayPeriods[0]?.questions || []}
      />
    </div>
  );
} 