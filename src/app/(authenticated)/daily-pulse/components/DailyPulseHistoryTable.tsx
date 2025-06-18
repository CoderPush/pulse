// This file has been moved from the root of daily-pulse to components/DailyPulseHistoryTable.tsx. 

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { SubmissionPeriod, Submission } from './DailyPulseCalendar';
import { fetchSubmissionAnswers, refetchMonthSubmissions } from '../actions';
import DailyPulseForm from './DailyPulseForm';
import { useToast } from '@/components/ui/use-toast';
import type { Question } from './DailyPulseForm';

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
  questionsByTemplateId: Record<string, { id: string; title?: string }[]>;
  user?: { id: string };
  refreshData?: () => void;
}

const DailyPulseHistoryTable: React.FC<DailyPulseHistoryTableProps> = ({ monthDays, periodByDate, monthSubmissions: initialMonthSubmissions, templateMap, questionsByTemplateId, user, refreshData }) => {
  const today = new Date();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [expandedPeriodId, setExpandedPeriodId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, SubmissionAnswer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<string | null>(null);
  const [errorAnswers, setErrorAnswers] = useState<string | null>(null);
  const [activeMissed, setActiveMissed] = useState<{ date: string; periodId: string } | null>(null);
  const [monthSubmissions, setMonthSubmissions] = useState<Submission[]>(initialMonthSubmissions);
  const { toast } = useToast();

  // Fetch answers when a row is expanded
  useEffect(() => {
    const fetchAnswers = async (submissionId: string) => {
      setLoadingAnswers(submissionId);
      setErrorAnswers(null);
      const { data, error } = await fetchSubmissionAnswers(submissionId);
      if (error) {
        setErrorAnswers('Failed to fetch answers');
        setLoadingAnswers(null);
        return;
      }
      setAnswers(prev => ({ ...prev, [submissionId]: data || [] }));
      setLoadingAnswers(null);
    };
    console.log('expandedKey', expandedKey, expandedPeriodId);
    if (expandedKey && expandedPeriodId) {
      // Find the submission for the expanded row
      const periodId = expandedPeriodId;
      const submission = monthSubmissions.find(
        (s) => s.submission_period_id === periodId
      );
      if (submission && !answers[submission.id]) {
        fetchAnswers(submission.id);
      }
    }
  }, [expandedKey, expandedPeriodId, periodByDate, monthSubmissions, answers]);

  // Refetch submissions for the month
  async function refetchMonthSubmissionsHandler() {
    if (!user) return;
    // Get all period IDs for the month
    const periodIds = Object.values(periodByDate).flat().map(p => p.id);
    if (periodIds.length === 0) return;
    const { data: allSubs } = await refetchMonthSubmissions(user.id, periodIds);
    setMonthSubmissions(allSubs || []);
  }

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
                // Find a submission for this period (ignore submitted_at date)
                const submission = monthSubmissions.find(
                  (s) => s.submission_period_id === period.id
                );
                let status: 'submitted' | 'missed' | 'not_assigned' | 'not_submitted' = 'not_assigned';
                if (period) {
                  if (submission) status = 'submitted';
                  else if (date < today) status = 'missed';
                  else if (date >= today) status = 'not_submitted';
                }
                const isExpanded = expandedKey === key && expandedPeriodId === period.id;
                const isMissedActive = activeMissed && activeMissed.date === key && activeMissed.periodId === period.id;
                return (
                  <React.Fragment key={`${period.id}-${key}`}>
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
                        {status === 'missed' && !isMissedActive && user && (
                          <Button size="sm" variant="outline" className="flex items-center gap-1"
                            onClick={() => setActiveMissed({ date: key, periodId: period.id })}>
                            Submit Now
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
                              {answers[submission.id].map(ans => {
                                const periodQuestions = questionsByTemplateId[period.template_id] || [];
                                return (
                                  <div key={ans.id} className="border-b pb-2 mb-2">
                                    <div className="font-medium text-gray-800">
                                      {periodQuestions.find(q => q.id === ans.question_id)?.title || ans.question_id}
                                    </div>
                                    <div className="text-gray-700 mt-1">
                                      {Array.isArray(ans.answer)
                                        ? ans.answer.map((a, i) => <span key={i} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1">{a}</span>)
                                        : ans.answer}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                    {status === 'missed' && isMissedActive && user && (
                      <tr>
                        <td colSpan={4} className="bg-blue-50/50 p-4">
                          <DailyPulseForm
                            user={user}
                            period={period}
                            questions={templateMap[period.template_id]?.questions as Question[] || questionsByTemplateId[period.template_id] || []}
                            template={templateMap[period.template_id] || null}
                            onSuccess={async () => {
                              setActiveMissed(null);
                              await refetchMonthSubmissionsHandler();
                              if (refreshData) await refreshData();
                              toast({ title: 'Check-in submitted!', description: 'Your missed check-in was submitted successfully.', duration: 4000 });
                            }}
                            onCancel={() => setActiveMissed(null)}
                          />
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