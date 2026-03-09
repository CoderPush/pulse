-- Phase 1 schema for project metric check-ins

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payload_version text,
ADD COLUMN IF NOT EXISTS open_note text;

COMMENT ON COLUMN public.submissions.project_id IS 'Project-scoped submissions such as project metric check-ins';
COMMENT ON COLUMN public.submissions.payload_version IS 'Version marker for rubric-based submission payloads';
COMMENT ON COLUMN public.submissions.open_note IS 'Optional open-ended note attached to a submission';

ALTER TABLE public.submissions
DROP CONSTRAINT IF EXISTS unique_submission_per_user_per_period;

CREATE UNIQUE INDEX IF NOT EXISTS submissions_unique_non_project_period_user
ON public.submissions (submission_period_id, user_id)
WHERE submission_period_id IS NOT NULL AND project_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS submissions_unique_project_period_user
ON public.submissions (submission_period_id, user_id, project_id)
WHERE submission_period_id IS NOT NULL AND project_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.project_checkin_metric_definitions (
    metric_key text PRIMARY KEY,
    display_order integer NOT NULL,
    layer text NOT NULL,
    name text NOT NULL,
    prompt text NOT NULL,
    description text,
    benchmark_version text NOT NULL DEFAULT 'v1',
    skippable boolean NOT NULL DEFAULT false,
    always_comment boolean NOT NULL DEFAULT false,
    tag_options jsonb NOT NULL DEFAULT '[]'::jsonb,
    project_type_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
    scale_guide jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT project_checkin_metric_definitions_layer_check CHECK (layer IN ('foundation', 'execution', 'outcome'))
);

CREATE TABLE IF NOT EXISTS public.project_checkin_metric_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    metric_key text NOT NULL REFERENCES public.project_checkin_metric_definitions(metric_key) ON DELETE RESTRICT,
    score integer,
    previous_score integer,
    delta integer,
    is_skipped boolean NOT NULL DEFAULT false,
    selected_tags text[] NOT NULL DEFAULT '{}'::text[],
    note text,
    trigger_flags text[] NOT NULL DEFAULT '{}'::text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT project_checkin_metric_responses_unique UNIQUE (submission_id, metric_key),
    CONSTRAINT project_checkin_metric_responses_score_check CHECK (
        (is_skipped = true AND score IS NULL) OR
        (is_skipped = false AND score BETWEEN 1 AND 5)
    ),
    CONSTRAINT project_checkin_metric_responses_previous_score_check CHECK (
        previous_score IS NULL OR previous_score BETWEEN 1 AND 5
    )
);

CREATE INDEX IF NOT EXISTS project_checkin_metric_responses_submission_idx
ON public.project_checkin_metric_responses (submission_id);

CREATE INDEX IF NOT EXISTS project_checkin_metric_responses_metric_idx
ON public.project_checkin_metric_responses (metric_key);

CREATE TABLE IF NOT EXISTS public.project_weekly_health (
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    submission_period_id integer NOT NULL REFERENCES public.submission_periods(id) ON DELETE CASCADE,
    metric_key text NOT NULL REFERENCES public.project_checkin_metric_definitions(metric_key) ON DELETE RESTRICT,
    average_score numeric(3, 1),
    min_score integer,
    max_score integer,
    variance numeric(8, 4),
    response_count integer NOT NULL DEFAULT 0,
    team_size integer NOT NULL DEFAULT 0,
    previous_average numeric(3, 1),
    alert_flags text[] NOT NULL DEFAULT '{}'::text[],
    calculated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id, submission_period_id, metric_key)
);

CREATE INDEX IF NOT EXISTS project_weekly_health_project_period_idx
ON public.project_weekly_health (project_id, submission_period_id);

CREATE UNIQUE INDEX IF NOT EXISTS submission_periods_unique_project_checkin_event
ON public.submission_periods (period_type, event_name)
WHERE period_type = 'project_checkin' AND event_name IS NOT NULL;

INSERT INTO public.submission_periods (
    period_type,
    start_date,
    end_date,
    event_name,
    event_description
)
SELECT
    'project_checkin',
    w.submission_start,
    w.submission_end,
    format('project-checkin-%s-W%s', w.year, lpad(w.week_number::text, 2, '0')),
    format('Project metric check-in for week %s of %s', w.week_number, w.year)
FROM public.weeks w
WHERE NOT EXISTS (
    SELECT 1
    FROM public.submission_periods sp
    WHERE sp.period_type = 'project_checkin'
      AND sp.event_name = format('project-checkin-%s-W%s', w.year, lpad(w.week_number::text, 2, '0'))
);

INSERT INTO public.project_checkin_metric_definitions (
    metric_key,
    display_order,
    layer,
    name,
    prompt,
    description,
    benchmark_version,
    skippable,
    always_comment,
    tag_options,
    project_type_overrides,
    scale_guide
)
VALUES
(
    'clarity',
    1,
    'foundation',
    'Clarity',
    'Is the team clear on requirements and priorities this week?',
    'Leading indicator for requirement clarity, priority alignment, and technical direction.',
    'v1',
    false,
    false,
    '["Requirements","Priorities","Technical direction","Scope change","Client communication"]'::jsonb,
    '{}'::jsonb,
    '[
      {"score":1,"label":"Lost","shortLabel":"No one knows what to build next","description":"Requirements are missing, contradictory, or impossible to act on."},
      {"score":2,"label":"Foggy","shortLabel":"Major gaps and frequent confusion","description":"The team can move only by making major assumptions."},
      {"score":3,"label":"Workable","shortLabel":"Some gaps but workable","description":"Most work is clear enough to continue, with a few known questions pending."},
      {"score":4,"label":"Clear","shortLabel":"Requirements are well understood","description":"Priorities and acceptance details are clear enough for confident execution."},
      {"score":5,"label":"Crystal","shortLabel":"Full alignment and autonomy","description":"The team can make edge-case decisions without waiting for clarification."}
    ]'::jsonb
),
(
    'team_capacity',
    2,
    'foundation',
    'Team Capacity',
    'How is workload versus a sustainable pace this week?',
    'Tracks whether the team has enough bandwidth to deliver without cutting quality.',
    'v1',
    false,
    false,
    '["Too many tasks","Blocked by dependency","Context-switching","Waiting for client","Under-staffed"]'::jsonb,
    '{}'::jsonb,
    '[
      {"score":1,"label":"Overloaded","shortLabel":"Burning out or fully blocked","description":"The team is overloaded or cannot progress meaningfully."},
      {"score":2,"label":"Stretched","shortLabel":"Heavy workload and cutting corners","description":"The team is rushing and quality is at risk."},
      {"score":3,"label":"Manageable","shortLabel":"Busy but sustainable","description":"The team can complete core work but has little buffer."},
      {"score":4,"label":"Comfortable","shortLabel":"Healthy pace with room for quality","description":"There is enough bandwidth for reviews, testing, and small surprises."},
      {"score":5,"label":"Spacious","shortLabel":"Plenty of room to improve","description":"The team can deliver while still investing in improvement and learning."}
    ]'::jsonb
),
(
    'codebase_health',
    3,
    'foundation',
    'Codebase Health',
    'How healthy is the codebase this week across tests, debt, and review quality?',
    'Measures whether the technical foundation is making delivery safer or harder.',
    'v1',
    true,
    false,
    '["Tech debt","Missing tests","Poor PR reviews","Outdated dependencies","Architecture issues"]'::jsonb,
    '{
      "discovery_poc":{"optional":true,"visibilityHint":"Code quality may be lighter for short-lived discovery work."},
      "staffing_embedded":{"optional":true,"visibilityHint":"Rate based on what you can observe inside the client environment."}
    }'::jsonb,
    '[
      {"score":1,"label":"Fragile","shortLabel":"Afraid to touch the code","description":"Changes feel dangerous and the team has low confidence in releases."},
      {"score":2,"label":"Messy","shortLabel":"Debt is slowing us down","description":"Debt and weak safety nets are noticeably hurting execution."},
      {"score":3,"label":"Acceptable","shortLabel":"Some debt but manageable","description":"The codebase is workable today but needs steady maintenance."},
      {"score":4,"label":"Solid","shortLabel":"Well maintained and reliable","description":"The codebase supports confident changes with healthy review and test practices."},
      {"score":5,"label":"Excellent","shortLabel":"Clean and easy to evolve","description":"The codebase is a strength for the team rather than a drag."}
    ]'::jsonb
),
(
    'delivery_progress',
    4,
    'execution',
    'Delivery Progress',
    'How is delivery progressing versus plan or expectation this week?',
    'Captures whether the project is on track relative to the most relevant commitment model.',
    'v1',
    false,
    false,
    '["Scope creep","Blocked","Bad estimate","Resource shortage","Dependency delay"]'::jsonb,
    '{
      "fixed_scope":{"prompt":"How is delivery progressing versus deadline and committed scope this week?"},
      "tm_retainer":{"prompt":"How is delivery progressing versus sprint or weekly commitment this week?"},
      "discovery_poc":{"prompt":"Are outputs moving the team toward a clear decision this week?"},
      "staffing_embedded":{"prompt":"Is your contribution visible and valued by the client team this week?"}
    }'::jsonb,
    '[
      {"score":1,"label":"Off-track","shortLabel":"Significantly behind with no clear recovery","description":"The project is materially off-track and stakeholders are likely worried."},
      {"score":2,"label":"Slipping","shortLabel":"Behind plan and risks are landing","description":"Key deliverables are late and the team needs corrective action."},
      {"score":3,"label":"On-plan","shortLabel":"Roughly on track","description":"The plan is holding with only minor adjustments."},
      {"score":4,"label":"Healthy","shortLabel":"Ahead on key items","description":"Delivery has good momentum with some useful buffer."},
      {"score":5,"label":"Exceeding","shortLabel":"Ahead and creating extra value","description":"The team is outperforming the original expectation."}
    ]'::jsonb
),
(
    'rework_waste',
    5,
    'execution',
    'Rework & Waste',
    'How much rework or wasted effort did the team experience this week?',
    'Highlights work that had to be redone or created little value.',
    'v1',
    false,
    false,
    '["Requirement changed","Misunderstanding","Bug fix","Wrong approach","Client feedback late"]'::jsonb,
    '{
      "discovery_poc":{"optional":true,"visibilityHint":"Some exploration work is expected in discovery and should be interpreted differently."}
    }'::jsonb,
    '[
      {"score":1,"label":"Severe waste","shortLabel":"Days of work thrown away","description":"Large amounts of effort were lost to major rework."},
      {"score":2,"label":"Significant","shortLabel":"Notable rework consumed the week","description":"The team lost meaningful time to avoidable rework."},
      {"score":3,"label":"Some","shortLabel":"Normal iterative rework","description":"Some rework happened but it was within normal delivery noise."},
      {"score":4,"label":"Minimal","shortLabel":"Very little rework","description":"Most work was done right the first time."},
      {"score":5,"label":"Zero waste","shortLabel":"Everything created value","description":"Work landed cleanly with no meaningful throw-away effort."}
    ]'::jsonb
),
(
    'collaboration_ownership',
    6,
    'execution',
    'Collaboration & Ownership',
    'How well is the team collaborating and taking ownership this week?',
    'Measures coordination quality, proactiveness, and unblock behavior.',
    'v1',
    false,
    false,
    '["Blocked by external","Waiting for decision","Poor communication","Lack of ownership","Siloed work"]'::jsonb,
    '{}'::jsonb,
    '[
      {"score":1,"label":"Siloed","shortLabel":"Isolation and major blocks","description":"The team is blocked, reactive, or unclear on ownership."},
      {"score":2,"label":"Friction","shortLabel":"Coordination issues slow work","description":"Communication is reactive and coordination is costing time."},
      {"score":3,"label":"Functional","shortLabel":"Coordination works with bottlenecks","description":"The team is operating adequately but still depends on a few people or bottlenecks."},
      {"score":4,"label":"Smooth","shortLabel":"Proactive teamwork","description":"The team communicates early, helps each other, and owns outcomes."},
      {"score":5,"label":"High-performing","shortLabel":"The team drives itself","description":"Ownership and collaboration are so strong that little external coordination is needed."}
    ]'::jsonb
),
(
    'client_alignment',
    7,
    'outcome',
    'Client Alignment',
    'How aligned and satisfied is the client with this week''s progress and output?',
    'Outcome metric for trust, satisfaction, and expectation fit.',
    'v1',
    false,
    false,
    '["Expectation mismatch","Scope dispute","Communication gap","Quality concern","Timeline pressure"]'::jsonb,
    '{}'::jsonb,
    '[
      {"score":1,"label":"Misaligned","shortLabel":"Client unhappy or far apart","description":"The client is clearly unhappy or expectations are badly misaligned."},
      {"score":2,"label":"Tension","shortLabel":"Concerns are visible","description":"The client has meaningful concerns that need quick attention."},
      {"score":3,"label":"Neutral","shortLabel":"Client is okay but not enthusiastic","description":"The relationship is stable but unremarkable."},
      {"score":4,"label":"Aligned","shortLabel":"Positive and trusting","description":"The client is satisfied and communication feels healthy."},
      {"score":5,"label":"Trusted partner","shortLabel":"Client sees the team as strategic","description":"The client actively seeks the team''s judgment beyond delivery updates."}
    ]'::jsonb
),
(
    'output_quality',
    8,
    'outcome',
    'Output Quality',
    'How strong was the quality of delivered output this week?',
    'Outcome metric for what the team shipped, demonstrated, or handed over.',
    'v1',
    false,
    false,
    '["Bugs","UX issues","Performance","Not matching requirements","Incomplete"]'::jsonb,
    '{
      "discovery_poc":{"prompt":"Were the outputs good enough to support a decision this week?"},
      "staffing_embedded":{"optional":true,"visibilityHint":"Rate based on what you can directly observe in the client environment."}
    }'::jsonb,
    '[
      {"score":1,"label":"Broken","shortLabel":"Critical issues make it unusable","description":"The output is not usable or not fit for review."},
      {"score":2,"label":"Flawed","shortLabel":"Major fixes are needed","description":"The output works partially but quality issues are obvious and significant."},
      {"score":3,"label":"Acceptable","shortLabel":"Usable with rough edges","description":"The output is serviceable with some polish or fixes still needed."},
      {"score":4,"label":"Good","shortLabel":"Solid output that meets expectations","description":"The delivered work is strong and only minor feedback remains."},
      {"score":5,"label":"Exceptional","shortLabel":"Polished and impressive","description":"The output clearly exceeds the expected quality bar."}
    ]'::jsonb
),
(
    'learning_velocity',
    9,
    'outcome',
    'Learning Velocity',
    'What did the team learn or improve this week?',
    'Captures whether the team is improving, not just delivering.',
    'v1',
    false,
    true,
    '["New tech/tool","Process improvement","Skill growth","Problem solved","Knowledge shared"]'::jsonb,
    '{}'::jsonb,
    '[
      {"score":1,"label":"Stagnant","shortLabel":"No learning or improvement","description":"The team repeated the same patterns without improvement."},
      {"score":2,"label":"Slow","shortLabel":"Gaps are known but unchanged","description":"The team sees the problem but has not acted on it yet."},
      {"score":3,"label":"Steady","shortLabel":"Some small improvements applied","description":"The team made incremental progress or applied recent lessons."},
      {"score":4,"label":"Growing","shortLabel":"Clear process or skill improvement","description":"The team can point to a concrete improvement made this week."},
      {"score":5,"label":"Breakthrough","shortLabel":"Major learning worth sharing","description":"The week produced a meaningful learning milestone worth amplifying."}
    ]'::jsonb
)
ON CONFLICT (metric_key) DO UPDATE
SET
    display_order = EXCLUDED.display_order,
    layer = EXCLUDED.layer,
    name = EXCLUDED.name,
    prompt = EXCLUDED.prompt,
    description = EXCLUDED.description,
    benchmark_version = EXCLUDED.benchmark_version,
    skippable = EXCLUDED.skippable,
    always_comment = EXCLUDED.always_comment,
    tag_options = EXCLUDED.tag_options,
    project_type_overrides = EXCLUDED.project_type_overrides,
    scale_guide = EXCLUDED.scale_guide;
