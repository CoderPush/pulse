// This file has been moved from the root of daily-pulse to components/DailyPulseCalendar.tsx. 

import React from 'react';

// Types matching the structure from DailyPulseClient and submissions table
export interface SubmissionPeriod {
  id: string;
  period_type: string;
  start_date: string;
  end_date: string;
  template_id: string;
}

export interface Submission {
  id: string;
  submission_period_id: string;
  submitted_at: string;
  user_id: string;
  type: string;
}

interface DailyPulseCalendarProps {
  monthDays: Date[];
  periodByDate: Record<string, SubmissionPeriod[]>;
  monthSubmissions: Submission[];
  todayUTC: string;
}

// Helper to determine the status for a given day with multiple periods
function getDayStatus({ date, key, periods, monthSubmissions, todayUTC }: {
  date: Date;
  key: string;
  periods: SubmissionPeriod[];
  monthSubmissions: Submission[];
  todayUTC: string;
}): 'submitted' | 'missed' | 'not_assigned' | 'not_submitted' {
  if (!periods || periods.length === 0) return 'not_assigned';
  let hasMissed = false;
  let hasNotSubmitted = false;
  let allSubmitted = true;
  for (const period of periods) {
    const submission = monthSubmissions.find(
      (s) => s.submission_period_id === period.id
    );
    const isToday = key === todayUTC;
    if (submission) continue;
    allSubmitted = false;
    if (date < new Date(todayUTC)) hasMissed = true;
    else if (isToday || date >= new Date(todayUTC)) hasNotSubmitted = true;
  }
  if (allSubmitted) return 'submitted';
  if (hasMissed) return 'missed';
  if (hasNotSubmitted) return 'not_submitted';
  return 'not_assigned';
}

const DailyPulseCalendar: React.FC<DailyPulseCalendarProps> = ({ monthDays, periodByDate, monthSubmissions, todayUTC }) => {

  console.log('periodByDate', periodByDate);
  return (
    <div className="mb-10">
      <h2 className="font-bold mb-3 text-lg text-gray-800">This Month&apos;s Check-in Overview</h2>
      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-7 gap-2 text-left text-xs font-semibold text-gray-500 mb-2 pl-2">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for first week */}
          {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
            <div key={i}></div>
          ))}
          {/* Days of month */}
          {monthDays.map((date) => {
            const day = date.getDate();
            const key = date.toISOString().slice(0, 10);
            const periods = periodByDate[key] || [];
            const status = getDayStatus({ date, key, periods, monthSubmissions, todayUTC });
            const isToday = key === todayUTC;
            return (
              <div
                key={day}
                className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm leading-none text-center cursor-pointer transition-all
                  ${status === 'submitted' ? 'bg-green-500 text-white' : ''}
                  ${status === 'missed' ? 'bg-red-500 text-white' : ''}
                  ${status === 'not_assigned' ? 'bg-gray-300 text-gray-500' : ''}
                  ${status === 'not_submitted' ? 'bg-yellow-400 text-white' : ''}
                  ${isToday ? 'ring-2 ring-blue-400 border-2 border-blue-400' : ''}
                  ${status === 'not_assigned' ? 'opacity-50' : 'hover:scale-110'}
                `}
                title={status.charAt(0).toUpperCase() + status.slice(1)}
              >
                {day}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Submitted</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Not Submitted</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Missed</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span> Not Assigned</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-blue-400 inline-block"></span> Today</div>
        </div>
      </div>
    </div>
  );
};

export default DailyPulseCalendar; 