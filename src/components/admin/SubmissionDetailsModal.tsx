import { Submission, Project } from '../../types/weekly-pulse';

interface SubmissionDetailsModalProps {
  submission: Submission;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmissionDetailsModal({ submission, isOpen, onClose }: SubmissionDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Submission Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Week</h3>
                <p className="mt-1 text-sm text-gray-900">Week {submission.week_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Manager</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.manager}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Submitted At</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(submission.submission_at).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Form Completion Time</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {submission.form_completion_time ? `${submission.form_completion_time} minutes` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-500">Primary Project</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Project Name</h4>
                  <p className="mt-1 text-sm text-gray-900">{submission.primary_project?.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Hours</h4>
                  <p className="mt-1 text-sm text-gray-900">{submission.primary_project?.hours}</p>
                </div>
              </div>
            </div>

            {submission.additional_projects && submission.additional_projects.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Additional Projects</h3>
                <div className="mt-2 space-y-4">
                  {submission.additional_projects.map((project: Project, index: number) => (
                    <div key={index} className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Project Name</h4>
                        <p className="mt-1 text-sm text-gray-900">{project.name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Hours</h4>
                        <p className="mt-1 text-sm text-gray-900">{project.hours}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submission.feedback && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Feedback</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.feedback}</p>
              </div>
            )}

            {submission.changes_next_week && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Changes Next Week</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.changes_next_week}</p>
              </div>
            )}

            {submission.milestones && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Milestones</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.milestones}</p>
              </div>
            )}

            {submission.other_feedback && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Other Feedback</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.other_feedback}</p>
              </div>
            )}

            {submission.hours_reporting_impact && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Hours Reporting Impact</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.hours_reporting_impact}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
} 