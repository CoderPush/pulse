import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import React from 'react';
import { SubmissionPeriod, Submission } from './DailyPulseCalendar';

interface Template {
  id: string;
  name: string;
  description: string;
}

interface DailyPulseHistoryTableProps {
  monthDays: Date[];
  periodByDate: Record<string, SubmissionPeriod | undefined>;
  monthSubmissions: Submission[];
  todayUTC: string;
  template: Template;
}

const DailyPulseHistoryTable: React.FC<DailyPulseHistoryTableProps> = ({ monthDays, periodByDate, monthSubmissions, template }) => {
  const today = new Date();
  return (
    <div>
      <h2 className="font-bold mb-3 text-lg text-gray-800">Daily Pulse History (This Month)</h2>
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-900">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Check-in</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {monthDays.map((date) => {
              const key = date.toISOString().slice(0, 10);
              const period = periodByDate[key];
              // Find a submission for this period where submitted_at matches this day
              let submission = null;
              if (period) {
                submission = monthSubmissions.find(
                  (s) =>
                    s.submission_period_id === period.id &&
                    new Date(s.submitted_at).toISOString().slice(0, 10) === key
                );
              }
              let status: 'submitted' | 'missed' | 'not_assigned' | 'not_submitted' = 'not_assigned';
              if (period) {
                if (submission) status = 'submitted';
                else if (date < today) status = 'missed';
                else if (date.getTime() === today.getTime()) status = 'not_submitted';
              }
              return (
                <tr key={key} className={date.getTime() === today.getTime() ? 'bg-blue-50 font-bold' : ''}>
                  <td className="px-4 py-2 whitespace-nowrap">{key}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{period ? template?.name || 'Daily Check-in' : '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {status === 'submitted' && <Badge className="bg-green-500 text-white">Submitted</Badge>}
                    {status === 'missed' && <Badge className="bg-red-500 text-white">Missed</Badge>}
                    {status === 'not_submitted' && <Badge className="bg-yellow-400 text-white">Not Submitted</Badge>}
                    {status === 'not_assigned' && <Badge className="bg-gray-300 text-gray-500">Not Assigned</Badge>}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {status === 'submitted' && (
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> View
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyPulseHistoryTable; 