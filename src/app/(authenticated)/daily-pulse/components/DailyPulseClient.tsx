"use client";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays } from 'lucide-react';
import DailyPulseCalendar from './DailyPulseCalendar';
import DailyPulseHistoryTable from './DailyPulseHistoryTable';
import { SubmissionPeriod, Submission } from './DailyPulseCalendar';
import DailyPulseFormInner from './DailyPulseFormInner';
import { handleFormFieldChangeArray } from './handleFormFieldChange';
import {
  fetchTodayPeriods,
  fetchQuestionsByTemplateIds,
  fetchTemplateById,
  fetchSubmission,
  fetchMonthPeriods,
  fetchTemplatesByIds,
  fetchSubmissions,
  submitDailyPulse
} from '../actions';
import type { Template, Question, DailyPeriodForm } from '@/types/followup';

export default function DailyPulseClient({ user }: { user: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayPeriods, setTodayPeriods] = useState<DailyPeriodForm[]>([]); // Array of { period, template, questions, submission, form, submitted, submitting, submitError }
  const [monthPeriods, setMonthPeriods] = useState<SubmissionPeriod[]>([]);
  const [monthSubmissions, setMonthSubmissions] = useState<Submission[]>([]);
  const [monthTemplates, setMonthTemplates] = useState<Record<string, Template>>({});
  const [questionsByTemplateId, setQuestionsByTemplateId] = useState<Record<string, Question[]>>({});

  // Refactored fetchData so it can be called on demand
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = new Date();
    const nowStr = new Date().toISOString();
    // 1. Fetch all periods for today
    const { data: periodUsers, error: periodError } = await fetchTodayPeriods(user.id, nowStr);
    if (periodError) {
      setError(periodError.message);
      setLoading(false);
      return;
    }
    // Gather all template_ids for today
    const todayTemplateIds = Array.from(new Set((periodUsers || []).map((pu: { submission_periods: SubmissionPeriod }) => pu.submission_periods.template_id)));
    // Preload all questions for today's templates in one query
    const questionsByTemplate: Record<string, Question[]> = {};
    if (todayTemplateIds.length > 0) {
      const { data: allQuestionsData } = await fetchQuestionsByTemplateIds(todayTemplateIds);
      // Group questions by template_id
      for (const row of allQuestionsData || []) {
        if (!row.template_id) continue;
        if (!questionsByTemplate[row.template_id]) questionsByTemplate[row.template_id] = [];
        if (row.questions && typeof row.questions === 'object' && !Array.isArray(row.questions)) {
          questionsByTemplate[row.template_id].push(row.questions);
        }
      }
    }
    // 2. For each period, fetch template, questions, and submission
    const periodForms = await Promise.all((periodUsers || []).map(async (pu: { submission_periods: SubmissionPeriod }) => {
      const period = pu.submission_periods;
      // Fetch template
      const { data: template } = await fetchTemplateById(period.template_id);
      // Use preloaded questions
      let questions: Question[] = questionsByTemplate[period.template_id] || [];
      // Deduplicate questions by id
      const seen = new Set();
      questions = questions.filter(q => {
        if (seen.has(q.id)) return false;
        seen.add(q.id);
        return true;
      });
      // Fetch submission
      const { data: submissionData } = await fetchSubmission(user.id, period.id, 'daily');
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
    const { data: allPeriodUsers } = await fetchMonthPeriods(user.id, monthStartStr, monthEndStr);
    const periods = (allPeriodUsers || []).map((pu: { submission_periods: SubmissionPeriod }) => pu.submission_periods);
    setMonthPeriods(periods);
    // Fetch all templates for these periods
    const templateIds = Array.from(new Set(periods.map((p: SubmissionPeriod) => p.template_id)));
    const templateMap: Record<string, Template> = {};
    if (templateIds.length > 0) {
      const { data: templatesData } = await fetchTemplatesByIds(templateIds);
      (templatesData || []).forEach((t: Template) => {
        templateMap[t.id] = t;
      });
    }
    setMonthTemplates(templateMap);
    // 4. Fetch all submissions for those periods
    const periodIds = periods.map((p: SubmissionPeriod) => p.id);
    let allSubmissions: Submission[] = [];
    if (periodIds.length > 0) {
      const { data: allSubs } = await fetchSubmissions(user.id, 'daily', periodIds);
      allSubmissions = allSubs || [];
    }
    setMonthSubmissions(allSubmissions);
    // Also build questionsByTemplateId for all templates in the month
    const questionsByTemplateId: Record<string, Question[]> = {};
    if (templateIds.length > 0) {
      const { data: allQuestionsData } = await fetchQuestionsByTemplateIds(templateIds);
      for (const row of allQuestionsData || []) {
        if (!row.template_id) continue;
        if (!questionsByTemplateId[row.template_id]) questionsByTemplateId[row.template_id] = [];
        if (row.questions && typeof row.questions === 'object' && !Array.isArray(row.questions)) {
          questionsByTemplateId[row.template_id].push(row.questions);
        }
      }
      // Deduplicate questions for each template
      for (const templateId of Object.keys(questionsByTemplateId)) {
        const seen = new Set();
        questionsByTemplateId[templateId] = questionsByTemplateId[templateId].filter(q => {
          if (seen.has(q.id)) return false;
          seen.add(q.id);
          return true;
        });
      }
    }
    setQuestionsByTemplateId(questionsByTemplateId);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler for submitting a form for a specific period
  async function handleSubmit(idx: number, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTodayPeriods(prev => prev.map((f, i) => i === idx ? { ...f, submitting: true, submitError: null } : f));
    const form = todayPeriods[idx].form;
    const period = todayPeriods[idx].period;
    const questions = todayPeriods[idx].questions;
    try {
      const result = await submitDailyPulse({
        userId: user.id,
        periodId: period.id,
        questions,
        form,
      });
      if (result.error) {
        setTodayPeriods(prev => prev.map((f, i) => i === idx ? { ...f, submitting: false, submitError: result.error + ' Please try again.' } : f));
        return;
      }
      setTodayPeriods(prev => prev.map((f, i) => i === idx ? { ...f, submitted: true, submitting: false } : f));
    } catch {
      setTodayPeriods(prev => prev.map((f, i) => i === idx ? { ...f, submitting: false, submitError: 'Something went wrong. Please try again.' } : f));
    }
  }

  // Handler for form field change
  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | string[]; type: string; checked?: boolean } }) =>
    handleFormFieldChangeArray(setTodayPeriods, idx)(e);

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
        <div key={f.period.id}>
          {!f.submitted ? (
            <DailyPulseFormInner
              form={f.form}
              questions={f.questions}
              submitting={f.submitting}
              submitError={f.submitError}
              onChange={e => handleChange(idx, e)}
              onSubmit={e => handleSubmit(idx, e)}
              template={f.template}
              submitLabel="Submit Daily Check-in"
            />
          ) : (
            <div className="text-green-700 font-semibold text-center py-4">✅ Daily Check-in submitted! Have a great day!</div>
          )}
        </div>
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
        questionsByTemplateId={questionsByTemplateId}
        user={user}
        refreshData={fetchData}
      />
    </div>
  );
} 