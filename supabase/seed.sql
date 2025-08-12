-- Generate weeks for current and next year
DO $$
DECLARE
    current_year INT;
    target_year INT;
    week_number INT;
    week_start DATE;
    week_end DATE;
    submission_start TIMESTAMP WITH TIME ZONE;
    submission_end TIMESTAMP WITH TIME ZONE;
    late_submission_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Generate weeks for current and next year
    FOR target_year IN current_year..(current_year + 1) LOOP
        -- Clear existing weeks for the year if any
        DELETE FROM public.weeks WHERE year = target_year;

        -- Generate weeks for the year
        FOR week_number IN 1..52 LOOP
            -- Calculate week start (Monday) and end (Sunday)
            week_start := DATE (target_year || '-01-01') + ((week_number - 1) * 7) * INTERVAL '1 day';
            week_end := week_start + 6 * INTERVAL '1 day';

            -- Calculate submission windows
            submission_start := week_start + 4 * INTERVAL '1 day' + TIME '17:00:00'; -- Friday 5PM
            submission_end := week_end + 1 * INTERVAL '1 day' + TIME '14:00:00'; -- Monday 2PM
            late_submission_end := submission_end + 1 * INTERVAL '1 day' + TIME '17:00:00'; -- Tuesday 5PM

            -- Insert the week
            INSERT INTO public.weeks (
                year,
                week_number,
                start_date,
                end_date,
                submission_start,
                submission_end,
                late_submission_end
            ) VALUES (
                target_year,
                week_number,
                week_start,
                week_end,
                submission_start,
                submission_end,
                late_submission_end
            );
        END LOOP;
    END LOOP;
END $$; 

-- Insert demo projects for local development (Marvel Avengers)
INSERT INTO public.projects (name, is_active)
VALUES
  ('Iron Man', TRUE),
  ('Captain America', TRUE),
  ('Thor', TRUE),
  ('Black Widow', TRUE),
  ('Hulk', TRUE),
  ('Hawkeye', TRUE),
  ('Vision', TRUE),
  ('Scarlet Witch', TRUE),
  ('Black Panther', TRUE),
  ('Spider-Man', TRUE),
  ('Doctor Strange', TRUE),
  ('Ant-Man', TRUE),
  ('Wasp', TRUE),
  ('Falcon', TRUE),
  ('War Machine', TRUE),
  ('Star-Lord', TRUE),
  ('Gamora', TRUE),
  ('Drax', TRUE),
  ('Rocket', TRUE),
  ('Groot', TRUE); 

-- Seed default questions for the questions table (version 1, parent_id = id)
INSERT INTO public.questions (id, parent_id, version, title, description, type, required, category, display_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 'What project did you spend most time on?', 'Select your primary project for this week', 'text', TRUE, 'primaryProject', 1),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, 'How many hours did you work on it?', 'Enter the number of hours spent on your primary project', 'number', TRUE, 'primaryProjectHours', 2),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 1, 'Who''s your manager right now?', 'Select your current manager', 'text', TRUE, 'manager', 3),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 1, 'Did you work on any other projects?', 'Add any additional projects and hours', 'text', FALSE, 'additionalProjects', 4),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 1, 'Any changes next week?', 'Mention further milestones/deadlines if applicable', 'textarea', FALSE, 'changesNextWeek', 5),
  ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 1, 'Anything else to share?', 'Wanting more/fewer challenges? Using more/less AI?', 'textarea', FALSE, 'otherFeedback', 6),
  ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 1, 'How has reporting the hours each week affected you?', 'Share your experience with weekly hour reporting', 'textarea', TRUE, 'hoursReportingImpact', 7); 

-- Insert Weekly Pulse template
INSERT INTO public.templates (id, name, description, type)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Weekly Pulse', 'The standard weekly pulse check-in form', 'weekly'); 

-- Link questions to the Weekly Pulse template
INSERT INTO public.template_questions (template_id, question_id, display_order)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 6),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', 7); 

-- Insert test users for E2E testing
INSERT INTO public.users (id, email, name, is_admin, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'test@coderpush.com', 'Test Developer', false, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'nopulse@coderpush.com', 'No Pulse User', false, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'admin@coderpush.com', 'Admin User', true, NOW()),
  ('44444444-4444-4444-4444-444444444444', 'manager@coderpush.com', 'Manager User', false, NOW()),
  ('55555555-5555-5555-5555-555555555555', 'developer@coderpush.com', 'Developer User', false, NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  is_admin = EXCLUDED.is_admin;

-- Insert test submissions for E2E testing
-- Note: These will be created after the weeks are generated above
DO $$
DECLARE
    current_year INT;
    current_week INT;
    test_user_id UUID := '11111111-1111-1111-1111-111111111111';
    manager_user_id UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    -- Get current year and week
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    current_week := EXTRACT(WEEK FROM CURRENT_DATE);
    
    -- Insert test submission for test@coderpush.com (current week)
    INSERT INTO public.submissions (
        user_id,
        year,
        week_number,
        primary_project_name,
        primary_project_hours,
        additional_projects,
        manager,
        feedback,
        changes_next_week,
        other_feedback,
        hours_reporting_impact,
        form_completion_time,
        status,
        is_late,
        submitted_at
    ) VALUES (
        test_user_id,
        current_year,
        current_week,
        'Iron Man',
        40,
        '[{"name": "Captain America", "hours": 8}, {"name": "Thor", "hours": 4}]',
        'manager@coderpush.com',
        'Excellent progress on the Iron Man project this week. Successfully completed the arc reactor prototype and began testing phase.',
        'Planning to finalize the flight stabilization system and conduct initial flight tests next week.',
        'The team collaboration has been outstanding, and I''m learning a lot from the cross-functional approach.',
        'Weekly reporting provides valuable insights into productivity patterns and helps maintain project momentum.',
        180,
        'submitted',
        false,
        NOW() - INTERVAL '2 days'
    );
    
    -- Insert test submission for test@coderpush.com (previous week)
    INSERT INTO public.submissions (
        user_id,
        year,
        week_number,
        primary_project_name,
        primary_project_hours,
        additional_projects,
        manager,
        feedback,
        changes_next_week,
        other_feedback,
        hours_reporting_impact,
        form_completion_time,
        status,
        is_late,
        submitted_at
    ) VALUES (
        test_user_id,
        current_year,
        current_week - 1,
        'Spider-Man',
        35,
        '[{"name": "Black Widow", "hours": 5}]',
        'manager@coderpush.com',
        'Focused on web-slinging mechanics optimization and successfully improved the wall-crawling system performance.',
        'Will transition to the Iron Man project next week as planned in the roadmap.',
        'The mentorship program continues to provide valuable guidance for professional development.',
        'Hour tracking analytics reveal positive trends in project efficiency and time management.',
        150,
        'submitted',
        false,
        NOW() - INTERVAL '9 days'
    );
    
    -- Insert test submission for test@coderpush.com (two weeks ago)
    INSERT INTO public.submissions (
        user_id,
        year,
        week_number,
        primary_project_name,
        primary_project_hours,
        additional_projects,
        manager,
        feedback,
        changes_next_week,
        other_feedback,
        hours_reporting_impact,
        form_completion_time,
        status,
        is_late,
        submitted_at
    ) VALUES (
        test_user_id,
        current_year,
        current_week - 2,
        'Black Panther',
        42,
        '[]',
        'manager@coderpush.com',
        'Successfully completed the vibranium suit upgrades and significantly improved the energy absorption system efficiency.',
        'Will transition to the Spider-Man project next week as scheduled.',
        'The team collaboration tools and processes are working exceptionally well.',
        'Weekly reporting maintains accountability and provides clear visibility into project progress.',
        200,
        'submitted',
        false,
        NOW() - INTERVAL '16 days'
    );
    
    -- Insert test submission for developer@coderpush.com (current week)
    INSERT INTO public.submissions (
        user_id,
        year,
        week_number,
        primary_project_name,
        primary_project_hours,
        additional_projects,
        manager,
        feedback,
        changes_next_week,
        other_feedback,
        hours_reporting_impact,
        form_completion_time,
        status,
        is_late,
        submitted_at
    ) VALUES (
        '55555555-5555-5555-5555-555555555555',
        current_year,
        current_week,
        'Doctor Strange',
        38,
        '[{"name": "Ant-Man", "hours": 6}]',
        'manager@coderpush.com',
        'Made significant progress on mystical arts implementation and successfully created stable dimensional portals.',
        'Planning to explore quantum realm applications and begin integration testing.',
        'The advanced training program is challenging but highly rewarding for skill development.',
        'Time tracking helps maintain balance across different magical disciplines and project priorities.',
        160,
        'submitted',
        false,
        NOW() - INTERVAL '1 day'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- If there's an error (e.g., week doesn't exist), just continue
        NULL;
END $$; 