'use client';

import { Submission } from '@/types/submission';
import { User } from '@supabase/supabase-js';
import { History, FileText } from 'lucide-react';

interface HistoryScreenProps {
  user: User;
  initialSubmission: Submission | null;
}

export default function HistoryScreen({ initialSubmission }: HistoryScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full gap-8 px-6">
      {!initialSubmission ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm w-full max-w-md">
          <div className="flex justify-center mb-6">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No submission found</h1>
          <p className="text-gray-600">Your latest submission will appear here</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm w-full max-w-md">
          <div className="flex justify-center mb-6">
            <History className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your Latest Submission</h1>
          <p className="text-gray-600 mb-6">Week {initialSubmission.week_number} • {new Date(initialSubmission.created_at).toLocaleDateString()}</p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Primary Project</div>
              <div className="font-medium">
                {initialSubmission.primary_project_name} ({initialSubmission.primary_project_hours} hours)
              </div>
            </div>

            {initialSubmission.additional_projects?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Additional Projects</div>
                {initialSubmission.additional_projects?.map((p, index) => (
                  <div key={index} className="font-medium">
                    {p.project} ({p.hours} hours)
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Manager</div>
              <div className="font-medium">{initialSubmission.manager}</div>
            </div>

            {initialSubmission.feedback && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Notes</div>
                <div className="font-medium">{initialSubmission.feedback}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 