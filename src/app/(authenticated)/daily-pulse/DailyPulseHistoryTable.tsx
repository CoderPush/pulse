import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { SubmissionPeriod, Submission } from './DailyPulseCalendar';
import { createClient } from '@/utils/supabase/client';

interface Template {
  id: string;
  name: string;
  description: string;
  questions?: { id: string; title: string }[];
}

interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer: string | string[];
}

interface DailyPulseHistoryTableProps {
  monthDays: Date[];
  periodByDate: Record<string, SubmissionPeriod[]>;
  monthSubmissions: Submission[];
  todayUTC: string;
  templateMap: Record<string, Template>;
  questions: { id: string; title?: string }[];
}

const DailyPulseHistoryTable: React.FC<DailyPulseHistoryTableProps> = ({ monthDays, periodByDate, monthSubmissions, templateMap, questions }) => {
  const today = new Date();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [expandedPeriodId, setExpandedPeriodId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, SubmissionAnswer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<string | null>(null);
  const [errorAnswers, setErrorAnswers] = useState<string | null>(null);

  // Fetch answers when a row is expanded
  useEffect(() => {
    const fetchAnswers = async (submissionId: string) => {
      setLoadingAnswers(submissionId);
      setErrorAnswers(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('submission_answers')
        .select('*')
        .eq('submission_id', submissionId);
      if (error) {
        setErrorAnswers('Failed to fetch answers');
        setLoadingAnswers(null);
        return;
      }
      setAnswers(prev => ({ ...prev, [submissionId]: data || [] }));
      setLoadingAnswers(null);
    };
    if (expandedKey && expandedPeriodId) {
      // Find the submission for the expanded row
      const key = expandedKey;
      const periodId = expandedPeriodId;
      const submission = monthSubmissions.find(
        (s) =>
          s.submission_period_id === periodId &&
          new Date(s.submitted_at).toISOString().slice(0, 10) === key
      );
      if (submission && !answers[submission.id]) {
        fetchAnswers(submission.id);
      }
    }
  }, [expandedKey, expandedPeriodId, periodByDate, monthSubmissions, answers]);

  console.log('monthSubmissions', monthSubmissions);
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
              const periods = periodByDate[key] || [];
              if (periods.length === 0) {
                return (
                  <tr key={key} className={date.getTime() === today.getTime() ? 'bg-blue-50 font-bold' : ''}>
                    <td className="px-4 py-2 whitespace-nowrap">{key}</td>
                    <td className="px-4 py-2 whitespace-nowrap">-</td>
                    <td className="px-4 py-2 whitespace-nowrap"><Badge className="bg-gray-300 text-gray-500">Not Assigned</Badge></td>
                    <td className="px-4 py-2 whitespace-nowrap"></td>
                  </tr>
                );
              }
              // For each period on this day, render a row
              return periods.map((period) => {
                // Find a submission for this period where submitted_at matches this day
                const submission = monthSubmissions.find(
                  (s) =>
                    s.submission_period_id === period.id &&
                    new Date(s.submitted_at).toISOString().slice(0, 10) === key
                );
                let status: 'submitted' | 'missed' | 'not_assigned' | 'not_submitted' = 'not_assigned';
                if (period) {
                  if (submission) status = 'submitted';
                  else if (date < today) status = 'missed';
                  else if (date >= today) status = 'not_submitted';
                }
                const isExpanded = expandedKey === key && expandedPeriodId === period.id;
                return (
                  <React.Fragment key={period.id}>
                    <tr className={date.getTime() === today.getTime() ? 'bg-blue-50 font-bold' : ''}>
                      <td className="px-4 py-2 whitespace-nowrap">{key}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{period ? (templateMap[period.template_id]?.name || period.template_id) : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {status === 'submitted' && <Badge className="bg-green-500 text-white">Submitted</Badge>}
                        {status === 'missed' && <Badge className="bg-red-500 text-white">Missed</Badge>}
                        {status === 'not_submitted' && <Badge className="bg-yellow-400 text-white">Not Submitted</Badge>}
                        {status === 'not_assigned' && <Badge className="bg-gray-300 text-gray-500">Not Assigned</Badge>}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {status === 'submitted' && (
                          <Button size="sm" variant="outline" className="flex items-center gap-1"
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedKey(null);
                                setExpandedPeriodId(null);
                              } else {
                                setExpandedKey(key);
                                setExpandedPeriodId(period.id);
                              }
                            }}>
                            <Eye className="w-4 h-4" /> {isExpanded ? 'Hide' : 'View'}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && submission && (
                      <tr>
                        <td colSpan={4} className="bg-blue-50/50 p-4">
                          <div className="font-semibold mb-2">Check-in Details for {key}</div>
                          {loadingAnswers === submission.id && <div className="text-sm text-gray-500">Loading answers...</div>}
                          {errorAnswers && <div className="text-sm text-red-500">{errorAnswers}</div>}
                          {!loadingAnswers && !errorAnswers && answers[submission.id] && (
                            <div className="space-y-2">
                              {answers[submission.id].length === 0 && <div className="text-sm text-gray-500">No answers found.</div>}
                              {answers[submission.id].map(ans => (
                                <div key={ans.id} className="border-b pb-2 mb-2">
                                  <div className="font-medium text-gray-800">
                                    {/* Find the question title by question_id */}
                                    {questions.find(q => q.id === ans.question_id)?.title || ans.question_id}
                                  </div>
                                  <div className="text-gray-700 mt-1">
                                    {Array.isArray(ans.answer)
                                      ? ans.answer.map((a, i) => <span key={i} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1">{a}</span>)
                                      : ans.answer}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyPulseHistoryTable; 