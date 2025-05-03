# Admin Pulses Preview Interface

## Overview
The admin pulses preview interface allows administrators to view and manage pulse forms for different weeks. This interface is crucial for maintaining data integrity while supporting evolving question sets over time.

## Features & Implementation Evidence

### 1. Navigation
- **Implemented:** There is a "Pulses" sidebar item in the admin dashboard (`src/app/admin/layout.tsx`).
- **Icon:** Uses `ListTodo` from Lucide, not `FileText` as originally planned.
- **Placement:** Between "Dashboard" and "Submissions".

### 2. Pulse List View
- **Implemented:**
  - `/admin/pulses` route exists (`src/app/admin/pulses/page.tsx`).
  - Grid layout of pulse weeks using shadcn/ui `Card`.
  - Each card displays:
    - Week number and year
    - Submission window dates
    - Status (Active/Past) via `Badge`
    - Quick stats: total submissions, completion rate
  - Sorting options: Latest first (default), Week number, Completion rate (via `Select`).

### 3. Pulse Preview Interface
- **Implemented:**
  - `/admin/pulses/[week]` route exists (`src/app/admin/pulses/[week]/page.tsx`).
  - Card-based layout for each question.
  - Questions grouped by type using shadcn/ui `Tabs` (categories: Project, Hours, Manager, Feedback, Impact).
  - Clear visual boundaries between questions.

### 4. Question Card Components
- **Implemented:**
  - Each question card includes:
    - Question text
    - Description/helper text
    - Input type preview (disabled input/textarea)
    - Required/Optional status
    - Question category/type (via `Badge`)
    - Version information

### 5. Route Structure
- **Implemented:**
  - `/admin/pulses` (list view)
  - `/admin/pulses/[week]` (preview specific week)

### 6. Component Structure
- **Partially Implemented:**
  - No separate files for `PulsesList`, `PulseCard`, `PulsePreview`, or `QuestionCard` in `src/components/admin/pulses/`.
  - All logic is in the route files (`page.tsx`), not split into smaller components as originally planned.
  - `PulseResponses` component exists in `src/components/admin/PulseResponses.tsx` for response analytics.

### 7. Database Considerations
- **Implemented:**
  - API endpoints (`src/app/api/admin/pulses/route.ts`, `[week]/route.ts`, `[week]/responses/route.ts`) support week-based submissions, question versioning, and flexible fields.
  - Versioning is handled in the API by switching question sets based on week.

### 8. UI Components
- **Implemented:**
  - Uses shadcn/ui `Card`, `Tabs`, `Select`, and `Badge` throughout the UI.

### 9. Question Card Layout
- **Implemented:**
  - Matches the planned layout, including all required fields and visual structure.

---

## Future Enhancements

### Phase 1: Basic Preview
- [x] Week selection
- [x] Question display
- [x] Basic preview functionality

### Phase 2: Question Management
- [ ] Question editing interface
- [ ] Version control for questions (UI)
- [ ] Question templates

### Phase 3: Analytics Integration
- [x] Response analytics per question (via `PulseResponses`)
- [ ] Trend analysis
- [ ] Impact assessment

---

## Notes

- All changes to questions are versioned in the API, but there is no UI for editing or tracking version history yet.
- Question modifications do not affect historical data (handled in API).
- Preview mode for testing changes is not yet implemented.
- Analytics dashboard integration is partially present (response analytics only).

---

## Summary Table

| Feature/Section         | Implemented | Notes |
|------------------------|-------------|-------|
| Sidebar Nav            | Yes         | Icon is `ListTodo`, not `FileText` |
| Route Structure        | Yes         | `/admin/pulses`, `/admin/pulses/[week]` |
| Component Structure    | Partial     | No separate files for planned components |
| Pulse List View        | Yes         | Grid, stats, sorting present |
| Pulse Preview          | Yes         | Grouped, card-based preview |
| Question Card          | Yes         | All fields present |
| UI Components          | Yes         | shadcn/ui used throughout |
| DB/Backend             | Yes         | Versioning, week logic present |
| Response Analytics     | Yes         | `PulseResponses` component |
| Editing/Version UI     | No          | Not yet implemented |
