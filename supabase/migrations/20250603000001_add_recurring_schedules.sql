

-- 1. Create recurring_schedules table
CREATE TABLE IF NOT EXISTS recurring_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    days_of_week TEXT[] NOT NULL, -- e.g., ['Mon','Tue','Thu','Fri']
    reminder_time TIME NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE
); 