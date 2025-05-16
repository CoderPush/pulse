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