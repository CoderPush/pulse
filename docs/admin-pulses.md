# Admin Pulses Preview Interface

## Overview
The admin pulses preview interface allows administrators to view and manage pulse forms for different weeks. This interface is crucial for maintaining data integrity while supporting evolving question sets over time.

## Features

### 1. Navigation
- New "Pulses" sidebar item in the admin dashboard
- Located between "Dashboard" and "Submissions" in the navigation
- Icon: `FileText` from Lucide icons to match existing UI patterns

### 2. Pulse List View
- Grid layout showing available pulse weeks
- Each pulse card displays:
  - Week number and year
  - Submission window dates
  - Status (Active/Past)
  - Quick stats (total submissions, completion rate)
- Sorting options:
  - Latest first (default)
  - Week number
  - Submission rate

### 3. Pulse Preview Interface
- Card-based layout for each question
- Clear visual boundaries between questions
- Questions grouped by type:
  - Project Selection
  - Hours Tracking
  - Manager Feedback
  - Additional Projects
  - General Feedback
  - Impact Assessment

### 4. Question Card Components
Each question card includes:
- Question text
- Description/Helper text
- Input type preview
- Required/Optional status
- Question category/type
- Version information

## Implementation Details

### 1. Route Structure
```typescript
/admin/pulses         // List view of all pulses
/admin/pulses/[week]  // Preview specific week's pulse
```

### 2. Component Structure
```typescript
src/
└── components/
    └── admin/
        ├── pulses/
        │   ├── PulsesList.tsx           // Grid of pulse weeks
        │   ├── PulseCard.tsx            // Individual pulse week card
        │   ├── PulsePreview.tsx         // Full preview of a pulse
        │   └── QuestionCard.tsx         // Individual question display
        └── layout/
            └── PulsesNav.tsx            // Sidebar navigation item
```

### 3. Database Considerations
Current schema supports versioning through:
- Week-based submissions
- Consistent question structure
- Flexible additional fields

### 4. UI Components
Using existing shadcn/ui components:
- `Card` for question containers
- `Tabs` for question categories
- `Select` for filtering options
- `Badge` for status indicators

### 5. Question Card Layout
```tsx
<Card className="p-6 space-y-4">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="text-lg font-semibold">{question.title}</h3>
      <p className="text-sm text-gray-500">{question.description}</p>
    </div>
    <Badge>{question.type}</Badge>
  </div>
  
  <div className="bg-gray-50 p-4 rounded-md">
    <p className="text-sm font-medium">Preview:</p>
    {/* Input type preview */}
  </div>
  
  <div className="flex items-center gap-2 text-sm text-gray-500">
    <span>{question.required ? 'Required' : 'Optional'}</span>
    <span>•</span>
    <span>Version {question.version}</span>
  </div>
</Card>
```

## Future Enhancements

### Phase 1: Basic Preview
- [x] Week selection
- [x] Question display
- [x] Basic preview functionality

### Phase 2: Question Management
- [ ] Question editing interface
- [ ] Version control for questions
- [ ] Question templates

### Phase 3: Analytics Integration
- [ ] Response analytics per question
- [ ] Trend analysis
- [ ] Impact assessment

## Notes
1. All changes to questions should be tracked with version history
2. Question modifications should not affect historical data
3. Consider implementing a preview mode for testing changes
4. Plan for future integration with analytics dashboard
