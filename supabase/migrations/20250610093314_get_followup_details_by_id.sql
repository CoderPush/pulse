-- 1. Create composite types for the return structure for type safety

-- Type for a participant
drop type if exists public.follow_up_participant cascade;
create type public.follow_up_participant as (
  id uuid,
  name text,
  email text
);

-- Type for a question (for editing)
drop type if exists public.follow_up_edit_question_details cascade;
create type public.follow_up_edit_question_details as (
  id uuid,
  title text,
  type text,
  description text,
  required boolean,
  choices text[],
  display_order int
);

-- Type for the main follow-up detail object
drop type if exists public.follow_up_details cascade;
create type public.follow_up_details as (
  id uuid,
  name text,
  description text,
  frequency text,
  days text[],
  "reminderTime" time,
  participants public.follow_up_participant[],
  questions public.follow_up_edit_question_details[]
);


-- 2. Create the RPC function
create or replace function get_followup_details_by_id(p_template_id uuid)
returns public.follow_up_details
language sql
security definer
as $$
with latest_period as (
  -- Find the most recent submission period for the given template
  select id, period_type
  from submission_periods
  where template_id = p_template_id
  order by start_date desc
  limit 1
),
participant_list as (
  -- Get all users assigned to the latest submission period
  select
    u.id,
    u.raw_user_meta_data->>'full_name' as name,
    u.email
  from auth.users u
  join submission_period_users spu on u.id = spu.user_id
  where spu.submission_period_id = (select id from latest_period)
)
select
  t.id,
  t.name,
  t.description,
  coalesce(lp.period_type, 'Ad-hoc') as frequency,
  coalesce(rs.days_of_week, '{}'::text[]) as days,
  rs.reminder_time as "reminderTime",
  array_agg(
    (pl.id, pl.name, pl.email)::public.follow_up_participant
  ) filter (where pl.id is not null) as participants,
  (
    select array_agg(
      (
        q.id,
        q.title,
        q.type,
        q.description,
        q.required,
        CASE
          WHEN jsonb_typeof(q.choices) = 'array' THEN
            ARRAY(SELECT jsonb_array_elements_text(q.choices))
          ELSE
            ARRAY[]::text[]
        END,
        tq.display_order
      )::public.follow_up_edit_question_details
      order by tq.display_order
    )
    from template_questions tq
    join questions q on tq.question_id = q.id
    where tq.template_id = t.id
  ) as questions
from templates t
left join recurring_schedules rs on t.id = rs.template_id
left join latest_period lp on true
left join participant_list pl on true
where t.id = p_template_id
group by t.id, t.name, t.description, lp.period_type, rs.days_of_week, rs.reminder_time;
$$;
