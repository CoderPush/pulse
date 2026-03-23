-- Submit a project check-in in a single transactional RPC.
-- This ensures that the submission row and all metric responses are written atomically.
-- If inserting any metric response fails, the entire operation is rolled back.

CREATE OR REPLACE FUNCTION public.submit_project_checkin(
    p_user_id uuid,
    p_project_id uuid,
    p_year integer,
    p_week_number integer,
    p_payload_version text,
    p_open_note text,
    p_submitted_at timestamptz,
    p_metric_responses jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_submission_id uuid;
BEGIN
    INSERT INTO public.submissions (
        user_id,
        project_id,
        type,
        year,
        week_number,
        payload_version,
        open_note,
        submitted_at
    )
    VALUES (
        p_user_id,
        p_project_id,
        'project_checkin',
        p_year,
        p_week_number,
        p_payload_version,
        p_open_note,
        p_submitted_at
    )
    RETURNING id INTO v_submission_id;

    -- Insert all metric responses bound to the new submission id.
    INSERT INTO public.project_checkin_metric_responses (
        submission_id,
        metric_key,
        score,
        previous_score,
        delta,
        is_skipped,
        selected_tags,
        note,
        trigger_flags
    )
    SELECT
        v_submission_id,
        (r->>'metric_key')::text AS metric_key,
        (r->>'score')::integer AS score,
        (r->>'previous_score')::integer AS previous_score,
        (r->>'delta')::integer AS delta,
        COALESCE((r->>'is_skipped')::boolean, false) AS is_skipped,
        COALESCE(
          ARRAY(
            SELECT jsonb_array_elements_text(r->'selected_tags')
          ),
          ARRAY[]::text[]
        ) AS selected_tags,
        r->>'note' AS note,
        COALESCE(
          ARRAY(
            SELECT jsonb_array_elements_text(r->'trigger_flags')
          ),
          ARRAY[]::text[]
        ) AS trigger_flags
    FROM jsonb_array_elements(p_metric_responses) AS r;

    RETURN v_submission_id;
END;
$$;

COMMENT ON FUNCTION public.submit_project_checkin(
    uuid,
    uuid,
    integer,
    integer,
    text,
    text,
    timestamptz,
    jsonb
) IS 'Atomically inserts a project_checkin submission and its metric responses from pre-computed JSON payloads.';

