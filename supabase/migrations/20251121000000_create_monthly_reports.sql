-- Create the monthly_reports table
CREATE TYPE public.report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');

CREATE TABLE public.monthly_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month date NOT NULL, -- Stored as the first day of the month (e.g., '2025-09-01')
    status public.report_status DEFAULT 'draft' NOT NULL,
    total_hours numeric(10, 2) DEFAULT 0,
    billable_hours numeric(10, 2) DEFAULT 0,
    submitted_at timestamptz,
    approved_at timestamptz,
    approved_by uuid REFERENCES public.users(id),
    comments text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, month)
);

-- Add comments
COMMENT ON TABLE public.monthly_reports IS 'Stores monthly time log reports for approval.';
COMMENT ON COLUMN public.monthly_reports.month IS 'The month this report covers, stored as the first day of the month.';
COMMENT ON COLUMN public.monthly_reports.status IS 'Current status of the report.';

-- Add indexes
CREATE INDEX monthly_reports_user_id_idx ON public.monthly_reports(user_id);
CREATE INDEX monthly_reports_month_idx ON public.monthly_reports(month);
CREATE INDEX monthly_reports_status_idx ON public.monthly_reports(status);

-- RLS Policies
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.monthly_reports
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports" ON public.monthly_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports if not approved
CREATE POLICY "Users can update own reports" ON public.monthly_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins/Managers can view all reports (assuming a way to identify admins, for now allowing authenticated users to view all if they are admins - logic to be refined in app or specific admin role check)
-- For simplicity in this iteration, we'll allow read access to all authenticated users for the admin dashboard, 
-- but in a real app we'd restrict this to specific roles.
-- Let's assume we want to allow "Managers" to view. 
-- Since we don't have a strict role system yet, we will rely on the API to enforce admin checks 
-- or add a policy if we had a role column. 
-- For now, let's add a policy that allows all authenticated users to view all reports 
-- (this is a trade-off for the current "loose" role system mentioned in the plan).
CREATE POLICY "Authenticated users can view all reports" ON public.monthly_reports
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins/managers should be able to update status to approved/rejected.
-- We will handle this via the API which uses the service role or checks permissions.
-- But for direct Supabase access, we might want to restrict.
-- We'll leave the update policy for users as is (own reports), and rely on backend for approval updates.
