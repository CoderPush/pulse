# Weekly Pulse Implementation Guide

## Tech Stack Overview

- **Frontend**: Next.js 14 with App Router, React 18, Tailwind CSS 3
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth + Database)
- **Database**: PostgreSQL with Drizzle ORM
- **Email**: Resend for production, Mailtrap for staging
- **Deployment**: Vercel
- **Background Jobs**: Vercel Cron Jobs

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard routes
│   ├── api/               # API routes
│   ├── auth/              # Authentication routes
│   ├── history/           # User history view
│   └── page.tsx           # Main submission form
├── components/            # Reusable UI components
│   ├── ui/               # shadcn components
│   ├── screens/          # Form screens
│   └── admin/            # Admin components
├── constants/             # App-wide constants
├── db/                    # Database schema and queries
├── lib/                   # Utility functions
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## UI Component Strategy

### Implemented shadcn Components
- Button
- Input
- Textarea
- Progress
- Card
- Form
- Toast
- Dialog

### Components To Be Added
- Command (for project search)
- DataTable (for admin views)
- Calendar (for week selection)
- Tabs (for admin dashboard)

### Form Implementation
```tsx
// Example form screen component
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function ProjectSelectionScreen() {
  return (
    <Card className="p-6">
      <Input 
        placeholder="Enter project name"
        onChange={(e) => setProject(e.target.value)}
      />
      <Button onClick={handleNext}>Next</Button>
    </Card>
  )
}
```

## Data Model

### Current Tables
1. **users**
   - id (UUID, primary key)
   - email (string, unique)
   - name (string)
   - created_at (timestamp)
   - is_admin (boolean)

2. **submissions**
   - id (UUID, primary key)
   - user_id (UUID, foreign key)
   - week_number (integer)
   - project (string)
   - hours_worked (integer)
   - manager_email (string)
   - notes (text, nullable)
   - submitted_at (timestamp)
   - is_late (boolean)

### Planned Tables
1. **projects**
   - id (UUID, primary key)
   - name (string, unique)
   - created_at (timestamp)

2. **reminder_logs**
   - id (UUID, primary key)
   - user_id (UUID, foreign key)
   - week_number (integer)
   - sent_at (timestamp)
   - type (enum: first, second, final)

## Key Components

### Authentication (Implemented)
- Supabase Auth with Google and Magic Link
- Protected routes via middleware
- Admin role management

### Submission Flow (Implemented)
1. Welcome Screen
2. Project Selection
3. Hours Worked
4. Manager Selection
5. Feedback
6. Review & Submit

### Admin Dashboard (In Progress)
- Submission tracking
- User management
- Data export
- Analytics dashboard

### History View (Planned)
- Personal submission history
- Week navigation
- Export functionality

## API Routes

1. `/api/submissions`
   - POST: Create submission
   - GET: List submissions (with filters)

2. `/api/weeks`
   - GET: Get current week
   - GET: List available weeks

Planned Routes:
1. `/api/projects`
   - GET: List projects
   - POST: Create project

2. `/api/admin`
   - GET: Dashboard stats
   - GET: User management
   - POST: Import data

## Background Jobs (Planned)

### Reminder System
1. **Friday 5PM**: Form opens for next week
2. **Monday 2PM**: On-time deadline
3. **Monday 5PM**: First reminder
4. **Tuesday 9AM**: Second reminder
5. **Tuesday 5PM**: Final cutoff

### Data Management
- Weekly submission window generation
- Data cleanup and archival
- Analytics generation

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
RESEND_API_KEY=your_resend_key
MAILTRAP_API_KEY=your_mailtrap_key
```

## Implementation Guidelines

1. **Mobile First**
   - All components are responsive
   - Touch-friendly inputs
   - Minimal scrolling

2. **Performance**
   - Client-side caching
   - Optimistic updates
   - Lazy loading for history

3. **Error Handling**
   - Form validation
   - Network error recovery
   - Toast notifications

4. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Color contrast compliance

## Testing Strategy

1. **Unit Tests** (To Be Implemented)
   - Form validation
   - Date calculations
   - Utility functions

2. **Integration Tests** (To Be Implemented)
   - Submission flow
   - Authentication
   - Admin features

3. **E2E Tests** (To Be Implemented)
   - Complete user journey
   - Admin workflows

## Deployment Checklist

1. **Pre-launch**
   - Database migrations
   - Environment setup
   - Email configuration
   - Admin user creation

2. **Launch**
   - Deploy to staging
   - QA testing
   - Deploy to production

3. **Post-launch**
   - Monitor errors
   - Track performance
   - Gather feedback 