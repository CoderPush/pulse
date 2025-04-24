'use client';

import { useState, useEffect } from 'react';
import { Submission } from '@/types/submission';
import { useAuth } from '@/providers/AuthProvider';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubmission = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`/api/submissions/history?email=${user.email}`);
          if (!response.ok) throw new Error('Failed to fetch submissions');
          const data = await response.json();
          const latest = data.sort((a: Submission, b: Submission) => b.week_number - a.week_number)[0];
          setSubmission(latest);
        } catch (error) {
          console.error('Error loading submission:', error);
        }
      }
      setLoading(false);
    };
    loadSubmission();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full gap-8 px-6">
        <div className="text-6xl">⏳</div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Loading your latest submission...</h1>
          <p className="text-gray-600">Just a moment while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center h-full gap-8 px-6">
      {!submission ? (
        <>
          <div className="text-6xl">📝</div>
          <div>
            <h1 className="text-2xl font-bold mb-2">No submission found</h1>
            <p className="text-gray-600">Your latest submission will appear here</p>
          </div>
        </>
      ) : (
        <>
          <div className="text-6xl">📊</div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Your Latest Submission</h1>
            <p className="text-gray-600 mb-6">Week {submission.week_number} • {new Date(submission.created_at).toLocaleDateString()}</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm w-full max-w-md">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Primary Project</div>
                <div className="font-medium">
                  {submission.primary_project?.name} ({submission.primary_project?.hours} hours)
                </div>
              </div>

              {submission.additional_projects?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Additional Projects</div>
                  {submission.additional_projects?.map((p, index) => (
                    <div key={index} className="font-medium">
                      {p.project} ({p.hours} hours)
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Manager</div>
                <div className="font-medium">{submission.manager}</div>
              </div>

              {submission.feedback && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Notes</div>
                  <div className="font-medium">{submission.feedback}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 