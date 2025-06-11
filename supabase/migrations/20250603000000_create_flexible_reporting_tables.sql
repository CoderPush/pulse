-- Migration to support flexible daily/ad-hoc reporting

-- 1. Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Template questions join table
CREATE TABLE IF NOT EXISTS template_questions (
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (template_id, question_id)
);

-- 3. Submission periods table
CREATE TABLE IF NOT EXISTS submission_periods (
    id serial PRIMARY KEY,
    period_type text NOT NULL, -- 'daily', 'ad-hoc', etc.
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    event_name text,
    event_description text,
    reminder_time TIME, -- When to send reminders for this period
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CHECK (start_date < end_date)
);

-- 4. Submission period users table
CREATE TABLE IF NOT EXISTS submission_period_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_period_id INTEGER REFERENCES submission_periods(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_period_users_period ON submission_period_users(submission_period_id);
CREATE INDEX IF NOT EXISTS idx_submission_period_users_user ON submission_period_users(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_periods_template ON submission_periods(template_id);
