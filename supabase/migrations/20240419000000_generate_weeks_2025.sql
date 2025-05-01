-- Generate weeks for 2025
DO $$
DECLARE
    target_year INT := 2025;
    week_number INT;
    week_start DATE;
    week_end DATE;
    submission_start TIMESTAMP WITH TIME ZONE;
    submission_end TIMESTAMP WITH TIME ZONE;
    late_submission_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Clear existing weeks for 2025 if any
    DELETE FROM public.weeks WHERE year = target_year;

    -- Generate weeks for the year
    FOR week_number IN 1..52 LOOP
        -- Calculate week start (Monday) and end (Sunday)
        week_start := DATE '2025-01-01' + ((week_number - 1) * 7) * INTERVAL '1 day';
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
END $$; 