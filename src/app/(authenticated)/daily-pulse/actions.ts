import { createClient } from '@/utils/supabase/client';

// Fetch all periods for today for a user
export async function fetchTodayPeriods(userId: string, nowStr: string) {
  const supabase = createClient();
  return supabase
    .from('submission_period_users')
    .select('*, submission_periods!inner(*)')
    .eq('user_id', userId)
    .eq('submission_periods.period_type', 'daily')
    .lte('submission_periods.start_date', nowStr)
    .gte('submission_periods.end_date', nowStr);
}

// Fetch all questions for a set of template IDs
export async function fetchQuestionsByTemplateIds(templateIds: string[]) {
  if (!templateIds.length) return { data: [], error: null };
  const supabase = createClient();
  return supabase
    .from('template_questions')
    .select('template_id, questions(*)')
    .in('template_id', templateIds)
    .order('display_order', { ascending: true });
}

// Fetch a template by ID
export async function fetchTemplateById(templateId: string) {
  const supabase = createClient();
  return supabase
    .from('templates')
    .select('id, name, description')
    .eq('id', templateId)
    .single();
}

// Fetch a submission for a user, period, and type
export async function fetchSubmission(userId: string, periodId: string, type: string) {
  const supabase = createClient();
  return supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('submission_period_id', periodId)
    .eq('type', type)
    .maybeSingle();
}

// Fetch all periods for the current month for a user
export async function fetchMonthPeriods(userId: string, monthStartStr: string, monthEndStr: string) {
  const supabase = createClient();
  return supabase
    .from('submission_period_users')
    .select('*, submission_periods!inner(*)')
    .eq('user_id', userId)
    .eq('submission_periods.period_type', 'daily')
    .gte('submission_periods.start_date', monthStartStr)
    .lte('submission_periods.end_date', monthEndStr);
}

// Fetch all templates by IDs
export async function fetchTemplatesByIds(templateIds: string[]) {
  if (!templateIds.length) return { data: [], error: null };
  const supabase = createClient();
  return supabase
    .from('templates')
    .select('id, name, description')
    .in('id', templateIds);
}

// Fetch all submissions for a user, type, and period IDs
export async function fetchSubmissions(userId: string, type: string, periodIds: string[]) {
  const supabase = createClient();
  return supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .in('submission_period_id', periodIds);
}

// Fetch answers for a submission
export async function fetchSubmissionAnswers(submissionId: string) {
  const supabase = createClient();
  return supabase
    .from('submission_answers')
    .select('*')
    .eq('submission_id', submissionId);
}

// Refetch all submissions for the month for a user
export async function refetchMonthSubmissions(userId: string, periodIds: string[]) {
  const supabase = createClient();
  return supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'daily')
    .in('submission_period_id', periodIds);
} 


export async function submitDailyPulse({
    userId,
    periodId,
    questions,
    form,
  }: {
    userId: string;
    periodId: string | number;
    questions: { id: string }[];
    form: Record<string, string | string[]>;
  }) {
    const supabase = createClient();
    // 1. Insert submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        user_id: userId,
        submission_period_id: periodId,
        submitted_at: new Date().toISOString(),
        type: 'daily',
      })
      .select()
      .single();
    if (submissionError || !submission) {
      return { error: 'Failed to submit check-in.' };
    }
    // 2. Insert answers
    const answers = questions.map((q) => {
      let answer = form[q.id];
      if (Array.isArray(answer)) {
        answer = JSON.stringify(answer);
      }
      return {
        submission_id: submission.id,
        question_id: q.id,
        answer: answer || '',
      };
    });
    const { error: answersError } = await supabase
      .from('submission_answers')
      .insert(answers);
    if (answersError) {
      return { error: 'Failed to save answers.' };
    }
    return { success: true };
  } 