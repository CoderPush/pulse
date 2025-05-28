import { ArrowLeft, Check, Clock } from 'lucide-react';
import { ScreenProps, Question } from '@/types/weekly-pulse';
import { useState } from 'react';

export default function ReviewScreen({ onBack, formData, onNext, questions = [] }: ScreenProps & { questions?: Question[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Set endTime just before sending
      const submissionData = {
        ...formData,
        endTime: new Date().toISOString(),
      };

      // Send raw form data to backend
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log the full error details
        console.error('Submission error details:', {
          status: response.status,
          statusText: response.statusText,
          data,
          weekNumber: formData.weekNumber
        });

        // Throw the actual error message from the server
        throw new Error(data.error || 'Failed to submit form');
      }

      onNext();
    } catch (error) {
      console.error('Error submitting:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get question title by category
  const getTitle = (category: string, fallback: string) => {
    return questions?.find(q => q.category === category)?.title || fallback;
  };

  return (
    <div className="flex flex-col h-full px-6">
      <h2 className="text-2xl font-bold mb-8">Review & Submit</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-6">
        {/* Dynamic Questions */}
        {questions.map((question) => {
          if ([
            'primaryProject',
            'primaryProjectHours',
            'manager',
            'additionalProjects',
            'formCompletionTime',
          ].includes(question.category)) {
            return null;
          }
          const answer = formData.answers?.[question.id];
          if (!answer) return null;
          return (
            <div key={question.id}>
              <div className="text-sm text-gray-500 mb-1">{question.title}</div>
              <div className="font-medium whitespace-pre-wrap">{answer}</div>
            </div>
          );
        })}
        
        <div>
          <div className="text-sm text-gray-500 mb-2">{getTitle('primaryProject', 'Primary Project')}</div>
          <div className="flex items-center justify-between">
            <div className="font-medium text-lg">{formData.primaryProject.name}</div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Clock size={12} className="mr-1" />
              {formData.primaryProject.hours} hours
            </div>
          </div>
        </div>
        
        {formData.additionalProjects.length > 0 && (
          <div>
            <div className="text-sm text-gray-500 mb-2">{getTitle('additionalProjects', 'Additional Projects')}</div>
            {formData.additionalProjects.map((proj, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-lg">{proj.project}</div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Clock size={12} className="mr-1" />
                    {proj.hours} hours
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div>
          <div className="text-sm text-gray-500 mb-1">{getTitle('manager', 'Manager')}</div>
          <div className="font-medium">{formData?.manager}</div>
        </div>
        
        {formData.feedback && (
          <div>
            <div className="text-sm text-gray-500 mb-1">{getTitle('feedback', 'Blockers & Feedback')}</div>
            <div className="font-medium">{formData.feedback}</div>
          </div>
        )}

        {formData.changesNextWeek && (
          <div>
            <div className="text-sm text-gray-500 mb-1">{getTitle('changesNextWeek', 'Changes Next Week')}</div>
            <div className="font-medium">{formData.changesNextWeek}</div>
          </div>
        )}

        {formData.otherFeedback && (
          <div>
            <div className="text-sm text-gray-500 mb-1">{getTitle('otherFeedback', 'Additional Comments')}</div>
            <div className="font-medium">{formData.otherFeedback}</div>
          </div>
        )}

        {formData.hoursReportingImpact && (
          <div>
            <div className="text-sm text-gray-500 mb-1">{getTitle('hoursReportingImpact', 'Hours Reporting Impact')}</div>
            <div className="font-medium">{formData.hoursReportingImpact}</div>
          </div>
        )}

      </div>
      
      <div className="mt-auto flex gap-3">
        <button 
          onClick={onBack}
          className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2"
          disabled={isSubmitting}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button 
          onClick={handleSubmit}
          className="relative bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center disabled:bg-blue-400 overflow-hidden group transition-all duration-300 shadow-lg hover:shadow-xl"
          disabled={isSubmitting}
        >
          <span className="relative z-10 flex items-center gap-2">
            {isSubmitting ? 'Submitting...' : 'Submit Now'} 
            <Check size={18} className="transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
          <span className="absolute -inset-1 bg-blue-400 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-300"></span>
        </button>
      </div>
    </div>
  );
} 