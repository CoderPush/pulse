-- Create monthly_report_comments table
CREATE TABLE public.monthly_report_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.monthly_reports(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.monthly_report_comments(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_monthly_report_comments_report_id ON public.monthly_report_comments(report_id);
CREATE INDEX idx_monthly_report_comments_parent_id ON public.monthly_report_comments(parent_id);
CREATE INDEX idx_monthly_report_comments_author_id ON public.monthly_report_comments(author_id);

-- RLS
ALTER TABLE public.monthly_report_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on their own reports
CREATE POLICY "Users can view comments on own reports" ON public.monthly_report_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.monthly_reports
            WHERE monthly_reports.id = monthly_report_comments.report_id
            AND monthly_reports.user_id = auth.uid()
        )
    );

-- Admins can view all comments (assuming authenticated for now as per other policies)
CREATE POLICY "Authenticated users can view all report comments" ON public.monthly_report_comments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert comments on their own reports
CREATE POLICY "Users can insert comments on own reports" ON public.monthly_report_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.monthly_reports
            WHERE monthly_reports.id = monthly_report_comments.report_id
            AND monthly_reports.user_id = auth.uid()
        )
    );

-- Admins can insert comments (assuming authenticated for now)
CREATE POLICY "Authenticated users can insert report comments" ON public.monthly_report_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
