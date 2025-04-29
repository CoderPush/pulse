# Weekly Pulse Implementation Guide

## Tech Stack Overview

- **Frontend**: Next.js 15 with App Router, React 19, Tailwind CSS 4
- **UI Components**: shadcn
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
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

## UI Component Strategy

### shadcn Integration

1. **Core Components**
   ```bash
   pnpm dlx shadcn@latest add button input textarea select progress card command dialog toast tabs table calendar tooltip
   ```

2. **Form Components to Replace**
   - Custom inputs → shadcn `Input`
   - Custom textareas → shadcn `Textarea`
   - Custom selects → shadcn `Select` and `Command`
   - Custom progress bar → shadcn `Progress`
   - Custom buttons → shadcn `Button`
   - Form container → shadcn `Card`

3. **New Components to Add**
   - `Command` for project search/selection
   - `Dialog` for confirmation modals
   - `Toast` for notifications
   - `Tabs` for admin dashboard views
   - `DataTable` for submission history
   - `Calendar` for week selection
   - `Tooltip` for info icons

4. **Form Handling**
   - Use React Hook Form with shadcn form components
   - Implement form validation with zod
   - Use shadcn's form error handling

### Component Examples

```tsx
// Project Selection Screen
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Command } from "@/components/ui/command"

export function ProjectSelectionScreen() {
  return (
    <Card className="p-6">
      <Command>
        <CommandInput placeholder="Search projects..." />
        <CommandList>
          <CommandEmpty>No projects found.</CommandEmpty>
          <CommandGroup>
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                onSelect={() => setFormData({ ...formData, project })}
              >
                {project.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </Card>
  )
}

// Admin Dashboard
import { DataTable } from "@/components/ui/data-table"

export function AdminDashboard() {
  return (
    <DataTable
      columns={columns}
      data={submissions}
      filterable
      sortable
    />
  )
}
```

## Data Model

### Tables

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

3. **projects**
   - id (UUID, primary key)
   - name (string, unique)
   - created_at (timestamp)

## Key Components

### Authentication
- Supabase Auth with Google and Magic Link
- Middleware for protected routes
- Admin role management

### Submission Flow
1. **Welcome Screen**
   - Greeting with user name
   - Current week display
   - Start button (shadcn Button)

2. **Project Selection**
   - Command component for searchable dropdown
   - Recent projects autocomplete
   - Project creation if not found

3. **Hours Worked**
   - Number input with validation (10-80)
   - Tooltip for info

4. **Manager Selection**
   - Command component for autocomplete
   - Team member lookup

5. **Feedback**
   - Textarea with character limit (500)
   - Optional field indicator

6. **Review & Submit**
   - Summary of all inputs
   - Submit button with confirmation dialog

### Admin Dashboard
- DataTable for submission tracking
- Tabs for different views
- Filter components
- Export functionality
- Historical data view

### History View
- DataTable for personal submission history
- Download option (CSV/PDF)
- Calendar for week navigation

## API Routes

1. `/api/submissions`
   - POST: Create new submission
   - GET: List submissions (with filters)

2. `/api/projects`
   - GET: List projects
   - POST: Create project

3. `/api/users`
   - GET: List users (admin only)
   - GET: Current user info

4. `/api/export`
   - GET: Export submissions

## Background Jobs

1. **Reminder System**
   - Friday 5PM: Form opens
   - Monday 2PM: On-time deadline
   - Monday 5PM: First reminder
   - Tuesday 9AM: Second reminder
   - Tuesday 12PM: Third reminder
   - Tuesday 5PM: Final cutoff

2. **Data Import**
   - Initial backfill (Weeks 9-15)
   - Weekly data cleanup

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
MAILTRAP_API_KEY=your_mailtrap_key
```

## Implementation Guidelines

1. **Mobile First**
   - All shadcn components are responsive by default
   - Touch-friendly inputs
   - Minimal scrolling

2. **Performance**
   - Optimistic updates
   - Client-side caching
   - Lazy loading for history

3. **Error Handling**
   - Form validation with zod
   - Network error recovery
   - Toast notifications for errors

4. **Accessibility**
   - shadcn components are accessible by default
   - ARIA labels
   - Keyboard navigation
   - Color contrast compliance

## Testing Strategy

1. **Unit Tests**
   - Form validation
   - Date calculations
   - Utility functions

2. **Integration Tests**
   - Submission flow
   - Authentication
   - Admin features

3. **End-to-End Tests**
   - Complete user journey
   - Admin workflows

## Deployment Checklist

1. **Pre-launch**
   - Database migrations
   - Environment setup
   - Email configuration
   - Admin user creation

2. **Launch**
   - Data import
   - Form activation
   - Reminder system start

3. **Post-launch**
   - Monitoring setup
   - Error tracking
   - Performance metrics 