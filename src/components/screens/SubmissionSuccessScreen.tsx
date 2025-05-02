'use client';

import { CheckCircle2, FileText, Trophy, Calendar } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

interface SubmissionSuccessScreenProps {
  user: User;
  currentWeek: number;
}

interface SubmissionStatus {
  week: number;
  submitted: boolean;
}

export default function SubmissionSuccessScreen({ user, currentWeek }: SubmissionSuccessScreenProps) {
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchSubmissionStatus() {
      try {
        const response = await fetch('/api/submissions/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            currentWeek,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submission status');
        }

        const data = await response.json();
        setSubmissionStatus(data);
      } catch (error) {
        console.error('Error fetching submission status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubmissionStatus();
  }, [user.id, currentWeek]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate stats based on submission status
  const totalWeeks = submissionStatus.length;
  const submittedWeeks = submissionStatus.filter(s => s.submitted).length;
  const completionRate = Math.round((submittedWeeks / totalWeeks) * 100);
  const consecutiveWeeks = calculateConsecutiveWeeks(submissionStatus);

  return (
    <div className="bg-white rounded-xl shadow-lg w-full max-w-md h-full flex flex-col relative overflow-hidden p-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Thanks for submitting this week!</h2>
        <p className="text-gray-600 mb-6">Your weekly pulse has been recorded for week {currentWeek}.</p>
        
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Your completion rate</span>
            <span className="text-sm text-gray-600">{submittedWeeks}/{totalWeeks} weeks</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300" 
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative mb-8">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200"></div>
          <div className="flex justify-between relative">
            {submissionStatus.map(({ week, submitted }) => (
              <div key={week} className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full mb-2 ${
                  submitted ? 'bg-green-500' : 
                  week === currentWeek ? 'bg-blue-600 ring-4 ring-blue-200' : 
                  'bg-gray-300'
                }`}></div>
                <span className="text-xs text-gray-600">Week {week}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-gray-800">{completionRate}%</div>
            <div className="text-xs text-gray-600">Completion Rate</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="flex justify-center mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-gray-800">{consecutiveWeeks}</div>
            <div className="text-xs text-gray-600">Consecutive Weeks</div>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/history'}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group"
        >
          <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
          View My Submission History
        </button>
      </div>
    </div>
  );
}

function calculateConsecutiveWeeks(submissionStatus: SubmissionStatus[]): number {
  let maxStreak = 0;
  let currentStreak = 0;

  // Sort by week number to ensure correct order
  const sortedStatus = [...submissionStatus].sort((a, b) => a.week - b.week);

  for (const status of sortedStatus) {
    if (status.submitted) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
} 