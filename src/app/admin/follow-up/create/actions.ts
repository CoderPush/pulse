'use server';

import { createClient } from '@/utils/supabase/server';
import { FollowUpQuestion } from '@/types/followup';
import { FollowUpFormValues } from '../FollowUpForm';
import { z } from 'zod';

const FollowUpSchema = z.object({
  templateId: z.string().uuid(),
  users: z.array(z.string().uuid()).min(1, { message: 'At least one user must be selected.' }),
  frequency: z.enum(['daily', 'weekly', 'ad-hoc']),
  days: z.array(z.string()).optional(),
  reminderTime: z.string().optional(),
});

// Define types for Supabase responses where needed
interface SubmissionPeriod {
  id: string;
}

export async function createFollowUpAction(values: FollowUpFormValues) {
  const parsed = FollowUpSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e: import('zod').ZodIssue) => e.message).join(', ') };
  }
  
  const { templateId, users, frequency, days, reminderTime } = parsed.data;
  
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    if (frequency !== 'ad-hoc') {
      // 1. Create Recurring Schedule
      const { error: scheduleError } = await supabase.from('recurring_schedules').insert({
        template_id: templateId,
        days_of_week: days || [],
        reminder_time: reminderTime || '09:00',
        start_date: new Date().toISOString().split('T')[0],
        user_ids: users,
      });
      if (scheduleError) throw new Error(`Failed to create schedule: ${scheduleError.message}`);

      // 2. Create submission_periods for all remaining days in this week (for selected days)
      const today = new Date();
      const daysOfWeek = days || [];
      for (let i = 0; i < 7 - today.getDay(); i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        date.setHours(0, 0, 0, 0);
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (!daysOfWeek.includes(dayStr)) continue;
        const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        const endDateStr = endDate.toISOString().slice(0, 10);
        // Check if period already exists (should not, but for safety)
        const { data: existing }: { data: SubmissionPeriod | null } = await supabase
          .from('submission_periods')
          .select('id')
          .eq('template_id', templateId)
          .eq('start_date', dateStr)
          .maybeSingle();
        if (existing) continue;
        // Create period
        const { data: periodData, error: periodError }: { data: SubmissionPeriod | null, error: { message: string } | null } = await supabase
          .from('submission_periods')
          .insert({
            template_id: templateId,
            period_type: frequency,
            start_date: dateStr,
            end_date: endDateStr,
            reminder_time: reminderTime || null,
          })
          .select('id')
          .single();
        if (periodError || !periodData) {
          console.error('Failed to create period', periodError);
          continue;
        }
        // Assign users
        const userAssignments = users.map((userId: string) => ({
          submission_period_id: periodData.id,
          user_id: userId,
        }));
        if (userAssignments.length > 0) {
          const { error: assignError }: { error: { message: string } | null } = await supabase.from('submission_period_users').insert(userAssignments);
          if (assignError) {
            console.error('Failed to assign users', assignError);
          }
        }
      }
      // Return success (skip the old single-period logic)
      return { success: true, message: 'Follow-up and periods for this week created successfully.' };
    }

    // Only handle ad-hoc here; recurring handled above
    // 2. Create the first Submission Period for ad-hoc
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 365); // Give a long deadline for ad-hoc

    const { data: periodData, error: periodError } = await supabase
      .from('submission_periods')
      .insert({
        template_id: templateId,
        period_type: frequency,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        reminder_time: reminderTime || null,
      })
      .select('id')
      .single();

    if (periodError || !periodData) {
      throw new Error(`Failed to create submission period: ${periodError?.message}`);
    }

    const submissionPeriodId = periodData.id;

    // 3. Assign users to the submission period
    const userAssignments = users.map((userId: string) => ({
      submission_period_id: submissionPeriodId,
      user_id: userId,
    }));

    const { error: assignmentError } = await supabase
      .from('submission_period_users')
      .insert(userAssignments);

    if (assignmentError) {
      throw new Error(`Failed to assign users: ${assignmentError.message}`);
    }

    return { success: true, message: 'Follow-up created successfully.' };

  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createQuestionsAction(questions: FollowUpQuestion[], name: string, description: string) {
  // Pre-validate: all titles non-empty and unique (case-insensitive)
  const titles = questions.map(q => q.title.trim().toLowerCase());
  if (titles.some(t => !t)) {
    return { success: false, error: 'All question titles must be non-empty.' };
  }
  if (new Set(titles).size !== titles.length) {
    return { success: false, error: 'Question titles must be unique.' };
  }

  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // 1. Insert template first to get an ID
    const { data: templateData, error: templateError } = await supabase
      .from('templates')
      .insert([{ name, description }])
      .select('id')
      .single();

    if (templateError || !templateData) {
      return { success: false, error: templateError?.message || 'Failed to create template' };
    }
    const templateId = templateData.id;

    // 2. Insert questions using the RPC and collect their new IDs
    const questionIds = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { data: questionData, error: questionError }: { data: { id: string } | null, error: { message: string } | null } = await supabase.rpc('insert_first_question', {
        q_title: q.title,
        q_description: q.description || '',
        q_type: q.type,
        q_required: q.required || false,
        q_choices: q.choices || null,
        q_display_order: i,
        q_category: null,
      });

      if (questionError || !questionData) {
        // NOTE: In a real-world scenario, you'd want to roll back the template creation here.
        // For now, we'll return an error.
        return { success: false, error: `Failed to insert question "${q.title}": ${questionError?.message}` };
      }
      // The RPC returns a single object, not an array
      if (questionData && questionData.id) {
          questionIds.push(questionData.id);
      } else {
          // Handle cases where the returned data is not in the expected format
          return { success: false, error: `Failed to retrieve ID for question "${q.title}"` };
      }
    }

    // 3. Link questions to the template
    const templateQuestions = questionIds.map((questionId, i) => ({
      template_id: templateId,
      question_id: questionId,
      display_order: i,
    }));

    const { error: linkError } = await supabase
      .from('template_questions')
      .insert(templateQuestions);

    if (linkError) {
      return { success: false, error: linkError.message };
    }
    
    return { success: true, templateId };

  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
} 