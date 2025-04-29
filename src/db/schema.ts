import { pgTable, serial, text, timestamp, uuid, boolean, integer, jsonb, primaryKey, index } from 'drizzle-orm/pg-core';

// Reference to Supabase auth.users table
export const authUsers = pgTable('auth.users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  rawUserMetaData: jsonb('raw_user_meta_data'),
  createdAt: timestamp('created_at', { withTimezone: true }),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name'),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const weeks = pgTable('weeks', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  weekNumber: integer('week_number').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  submissionStart: timestamp('submission_start', { withTimezone: true }).notNull(),
  submissionEnd: timestamp('submission_end', { withTimezone: true }).notNull(),
  lateSubmissionEnd: timestamp('late_submission_end', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  yearWeekUnique: primaryKey({ columns: [table.year, table.weekNumber] }),
}));

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  weekNumber: integer('week_number').notNull(),
  primaryProjectName: text('primary_project_name').notNull(),
  primaryProjectHours: integer('primary_project_hours').notNull(),
  additionalProjects: jsonb('additional_projects').default('[]'),
  manager: text('manager').notNull(),
  feedback: text('feedback'),
  changesNextWeek: text('changes_next_week'),
  milestones: text('milestones'),
  otherFeedback: text('other_feedback'),
  hoursReportingImpact: text('hours_reporting_impact'),
  formCompletionTime: integer('form_completion_time'),
  status: text('status').notNull().default('pending'),
  isLate: boolean('is_late').default(false),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reminderLogs = pgTable('reminder_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  weekNumber: integer('week_number').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  sentBy: uuid('sent_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  userWeekIdx: index('idx_reminder_logs_user_week').on(table.userId, table.weekNumber),
})); 