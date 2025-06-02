create or replace function insert_first_question(
  q_title text,
  q_description text,
  q_type text,
  q_required boolean,
  q_category text,
  q_display_order integer DEFAULT NULL,
  q_choices jsonb DEFAULT NULL
)
returns questions as $$
declare
  new_id uuid := gen_random_uuid();
  new_question questions;
  next_order integer;
begin
  if q_display_order is null then
    select coalesce(max(display_order), 0) + 1 into next_order
    from questions
    where parent_id = id; -- Only count first versions (latest questions)
  else
    next_order := q_display_order;
  end if;

  insert into questions (
    id, parent_id, version, title, description, type, required, category, display_order, choices
  ) values (
    new_id, new_id, 1, q_title, q_description, q_type, q_required, q_category, next_order, q_choices
  )
  returning * into new_question;
  return new_question;
end;
$$ language plpgsql security definer;
