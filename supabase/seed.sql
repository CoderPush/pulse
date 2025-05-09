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