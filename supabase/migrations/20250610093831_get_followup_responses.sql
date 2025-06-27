-- 1. Create composite types for the return structure for type safety

-- Type for a single answer
drop type if exists public.follow_up_answer cascade;
create type public.follow_up_answer as (
  question_id uuid,
  answer text
);

-- Type for a single submission, containing the user's answers
drop type if exists public.follow_up_submission cascade;
create type public.follow_up_submission as (
  user_id uuid,
  submitted_at timestamptz,
  answers public.follow_up_answer[]
);

-- Type for a single question in the template
drop type if exists public.follow_up_response_question_details cascade;
create type public.follow_up_response_question_details as (
  id uuid,
  text text,
  description text,
  display_order int
);

-- Type for a participant in the follow-up
drop type if exists public.follow_up_response_participant cascade;
create type public.follow_up_response_participant as (
  id uuid,
  name text,
  email text,
  avatar text -- just the first letter of name/email
);

-- Main return type for the RPC function
drop type if exists public.follow_up_responses_details cascade;
create type public.follow_up_responses_details as (
  id uuid,
  name text,
  questions public.follow_up_response_question_details[],
  participants public.follow_up_response_participant[],
  submissions public.follow_up_submission[]
);

-- 2. Create the RPC function
create or replace function get_followup_responses(
  p_template_id uuid,
  p_submission_period_id int
)
returns public.follow_up_responses_details
language sql
security definer
as $$
select
  t.id,
  t.name,
  -- Aggregate questions for the template
  (
    select array_agg(
      (q.id, q.title, q.description, tq.display_order)::public.follow_up_response_question_details
      order by tq.display_order
    )
    from template_questions tq
    join questions q on tq.question_id = q.id
    where tq.template_id = p_template_id
  ) as questions,
  -- Aggregate all participants assigned to this period
  (
    select array_agg(
      (u.id, u.raw_user_meta_data->>'full_name', u.email, upper(substring(coalesce(u.raw_user_meta_data->>'full_name', u.email), 1, 1)))::public.follow_up_response_participant
    )
    from submission_period_users spu
    join auth.users u on spu.user_id = u.id
    where spu.submission_period_id = p_submission_period_id
  ) as participants,
  -- Aggregate all submissions and their answers for this period
  (
    select array_agg(
      (
        s.user_id,
        s.submitted_at,
        (
          select array_agg(
            (sa.question_id, sa.answer)::public.follow_up_answer
          )
          from submission_answers sa
          where sa.submission_id = s.id
        )
      )::public.follow_up_submission
    )
    from submissions s
    where s.submission_period_id = p_submission_period_id
  ) as submissions
from templates t
where t.id = p_template_id;
$$;
