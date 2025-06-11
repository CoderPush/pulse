-- 1. Create a composite type for the return value to ensure type safety in RPC calls
drop type if exists public.admin_follow_up_list_item cascade;
create type public.admin_follow_up_list_item as (
  id uuid, -- This will be the template_id
  name text,
  description text,
  frequency text,
  days text[],
  "reminderTime" time,
  participants bigint,
  "createdAt" timestamptz,
  type text
);

-- 2. Create the RPC function
create or replace function get_followups_for_admin_list()
returns setof public.admin_follow_up_list_item
language sql
security definer
as $$
with latest_periods as (
  -- For each template, find its most recent submission period
  select distinct on (template_id)
    id,
    template_id,
    period_type
  from submission_periods
  order by template_id, start_date desc
)
select
  t.id,
  t.name,
  t.description,
  -- Get frequency from the latest period, default to 'Ad-hoc'
  coalesce(lp.period_type, 'Ad-hoc') as frequency,
  -- Get days from recurring schedule if it exists
  coalesce(rs.days_of_week, '{}'::text[]) as days,
  -- Get reminder time from recurring schedule if it exists
  rs.reminder_time as "reminderTime",
  -- Get participant count from the latest period
  (
    select count(spu.user_id)
    from submission_period_users spu
    where spu.submission_period_id = lp.id
  ) as participants,
  t.created_at as "createdAt",
  t.type
from templates t
left join latest_periods lp on t.id = lp.template_id
left join recurring_schedules rs on t.id = rs.template_id
order by t.created_at desc;
$$;
