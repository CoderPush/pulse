# Required
I need simple version database
- question hardcode
- project hardcode
- admin can view submission and filter by week 
- can view who submiteed, not submitted or late 

Table
- users
- submissions
- weeks

# Database Design v1

## Tables Overview

### 1. Users Table
```sql
CREATE TABLE public.users (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);
```

### 2. Weeks Table
```sql
CREATE TABLE public.weeks (
  id serial PRIMARY KEY,
  year integer NOT NULL,
  week_number integer NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  submission_start timestamp with time zone NOT NULL,
  submission_end timestamp with time zone NOT NULL,
  late_submission_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(year, week_number)
);
```

**Notes about Weeks Table:**
- Week numbers are calculated automatically (1-52 for each year)
- Each week has defined windows:
  - `start_date` and `end_date`: The actual week period
  - `submission_start`: When submissions open (Friday 5PM UTC+7)
  - `submission_end`: On-time deadline (Monday 2PM UTC+7)
  - `late_submission_end`: Final deadline (Tuesday 5PM UTC+7)
- Used for:
  - Filtering submissions by week in admin dashboard
  - Determining which week's data users can submit/edit
  - Tracking submission deadlines and late submissions
- Users can only submit/edit data for:
  - The current week (if within submission window)
  - The previous week (if within edit window)

### 3. Submissions Table
```sql
CREATE TABLE public.submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  week_number integer NOT NULL,
  primary_project_name text NOT NULL,
  primary_project_hours integer NOT NULL,
  additional_projects jsonb DEFAULT '[]'::jsonb,
  manager text NOT NULL,
  feedback text,
  changes_next_week text,
  milestones text,
  other_feedback text,
  hours_reporting_impact text,
  form_completion_time integer,
  status text NOT NULL DEFAULT 'pending',
  is_late boolean DEFAULT false,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  FOREIGN KEY (year, week_number) REFERENCES public.weeks(year, week_number)
);
```

**Notes about Submissions Table:**
- Uses `year` and `week_number` instead of `week_id` for easier frontend integration
- Maintains referential integrity with weeks table through composite foreign key
- Additional projects stored as JSONB for flexibility
- Tracks submission timing and status
- **Note**: Unique constraint `(user_id, year, week_number)` will be added later to enforce one submission per user per week
- For now, allows multiple submissions per user per week for testing and flexibility

## Future Database Changes
1. Add unique constraint to submissions table:
```sql
ALTER TABLE public.submissions
ADD CONSTRAINT unique_user_week_submission
UNIQUE (user_id, year, week_number);
```

2. Add index for better query performance:
```sql
CREATE INDEX idx_submissions_user_week
ON public.submissions (user_id, year, week_number);
```

## Week Data Generation

### Script to Generate Weeks
```typescript
// scripts/generate-weeks.ts
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const generateWeeks = async (year: number) => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    // Clear existing weeks for the year
    await client`
      DELETE FROM public.weeks WHERE year = ${year}
    `;

    // Generate weeks for the year
    for (let weekNumber = 1; weekNumber <= 52; weekNumber++) {
      // Calculate week start (Monday) and end (Sunday)
      const weekStart = new Date(year, 0, 1 + (weekNumber - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Calculate submission windows
      const submissionStart = new Date(weekStart);
      submissionStart.setDate(submissionStart.getDate() + 4); // Friday
      submissionStart.setHours(17, 0, 0, 0); // 5PM

      const submissionEnd = new Date(weekEnd);
      submissionEnd.setDate(submissionEnd.getDate() + 1); // Monday
      submissionEnd.setHours(14, 0, 0, 0); // 2PM

      const lateSubmissionEnd = new Date(submissionEnd);
      lateSubmissionEnd.setDate(lateSubmissionEnd.getDate() + 1); // Tuesday
      lateSubmissionEnd.setHours(17, 0, 0, 0); // 5PM

      await client`
        INSERT INTO public.weeks (
          year,
          week_number,
          start_date,
          end_date,
          submission_start,
          submission_end,
          late_submission_end
        ) VALUES (
          ${year},
          ${weekNumber},
          ${weekStart.toISOString()},
          ${weekEnd.toISOString()},
          ${submissionStart.toISOString()},
          ${submissionEnd.toISOString()},
          ${lateSubmissionEnd.toISOString()}
        )
      `;
    }

    console.log(`✅ Generated weeks for ${year}`);
  } catch (error) {
    console.error('❌ Failed to generate weeks:', error);
    throw error;
  } finally {
    await client.end();
  }
};

// Run for current year
generateWeeks(new Date().getFullYear()).catch((err) => {
  console.error('❌ Script failed');
  console.error(err);
  process.exit(1);
});
```

### Usage
1. Add script to package.json:
```json
{
  "scripts": {
    "db:generate-weeks": "tsx scripts/generate-weeks.ts"
  }
}
```

2. Run the script:
```bash
pnpm db:generate-weeks
```

## Key Features

1. **User Management**
   - Tracks user information and admin status
   - Links to Supabase auth system

2. **Weekly Tracking**
   - Automatic week numbering (1-52)
   - Clear start/end dates for each week
   - Defined submission windows
   - Supports filtering and reporting by week

3. **Submission Management**
   - Multiple submissions allowed per user per week (for now)
   - Tracks submission status and timeliness
   - Stores detailed project and feedback information
   - Supports multiple projects per submission
   - Direct year/week_number reference for easier frontend integration

4. **Admin Features**
   - Filter submissions by week
   - View submission status (on time/late/not submitted)
   - Track user submission history

## Data Flow

1. **Week Creation**
   - Weeks are generated at the start of each year
   - Each week has defined submission windows
   - Late submission cutoff is tracked per week

2. **User Submissions**
   - Users can submit multiple times for the same week (for now)
   - Submissions are marked as late if after deadline
   - Frontend uses year and week_number directly

3. **Admin Access**
   - View all submissions for any week
   - Filter by submission status
   - Track user participation