create or replace function get_submission_periods_for_template(p_template_id uuid)
returns table (
  id int,
  label text,
  start_date timestamptz
)
language sql
security definer
as $$
  select
    sp.id,
    to_char(sp.start_date, 'YYYY-MM-DD') as label,
    sp.start_date
  from submission_periods sp
  where sp.template_id = p_template_id
  order by sp.start_date desc;
$$;
