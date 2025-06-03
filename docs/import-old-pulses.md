# Submissions CSV Import Guide

## Required columns:
email (string)
week_number (number)
primary_project_name (string)
primary_project_hours (number)


## Optional columns:
additional_projects (semicolon-separated, e.g., Project Beta:5;Project Gamma:3)
manager (string)
feedback (string)
changes_next_week (string)
hour_reporting_impact (string)
form_completion_time (number, minutes)
submitted_at (ISO string, optional, if you want to preserve original time)

## Auto-calculated fields (do NOT include in CSV)
- year: calculated automatically (current year or from week mapping)
- is_late: always set to true
- status: always set to 'submitted'

## Required CSV columns
- email
- week_number
- primary_project_name
- primary_project_hours

## Optional CSV columns
- additional_projects (semicolon-separated, e.g., Project Beta:5;Project Gamma:3)
- manager
- feedback
- changes_next_week
- hour_reporting_impact
- form_completion_time
- submitted_at

## Example CSV
email,week_number,primary_project_name,primary_project_hours,additional_projects,manager,feedback,changes_next_week,hour_reporting_impact,form_completion_time,submitted_at
user1@example.com,23,Project Alpha,40,Project Beta:5;Project Gamma:3,Manager A,Good week,More focus,No impact,10,2024-06-06T12:00:00Z




## Import Process

1. **Upload the CSV** via the admin UI.
2. **For each row:**
   - The system will look up the user by email.
   - If the user is found, a submission will be created for the specified week/year.
   - If the user is not found, the row will be skipped and reported.
   - `additional_projects` will be parsed into a list of `{ name, hours }` objects.
3. **A summary** of successful and failed imports will be shown.

---

## Notes

- Only admins can use the import feature.
- Make sure emails in the CSV match existing users.
- If you need to import a large number of submissions, split them into smaller files if necessary.
