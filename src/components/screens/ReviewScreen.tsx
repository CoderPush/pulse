import { ArrowLeft, Check, Clock } from 'lucide-react';
import { ScreenProps, Question } from '@/types/weekly-pulse';
import { useState } from 'react';
import type { AdditionalProject } from '@/types/weekly-pulse';

const CORE_QUESTION_CATEGORIES = [
  'primaryProject',
  'primaryProjectHours',
  'manager',
  'additionalProjects',
  'formCompletionTime',
  'feedback',
  'changesNextWeek',
  'milestones',
  'otherFeedback',
  'hoursReportingImpact',
];

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

  // Prepare dynamic questions with answers
  const dynamicQuestions = questions.filter(q => !CORE_QUESTION_CATEGORIES.includes(q.category) && formData.answers?.[q.id]);

  return (
    <div className="flex flex-col h-full px-6">
      <h2 className="text-2xl font-bold mb-8">Review & Submit</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-6">
        {/* Core Questions */}
        {questions.filter(q => CORE_QUESTION_CATEGORIES.includes(q.category)).map((question) => {
          let value: string | number | AdditionalProject[] | undefined = '';
          switch (question.category) {
            case 'primaryProject':
              value = formData.primaryProject.name;
              break;
            case 'primaryProjectHours':
              value = formData.primaryProject.hours;
              break;
            case 'manager':
              value = formData.manager;
              break;
            case 'additionalProjects':
              value = formData.additionalProjects;
              break;
            case 'formCompletionTime':
              value = formData.formCompletionTime;
              break;
            case 'feedback':
              value = formData.feedback;
              break;
            case 'changesNextWeek':
              value = formData.changesNextWeek;
              break;
            case 'milestones':
              value = formData.milestones;
              break;
            case 'otherFeedback':
              value = formData.otherFeedback;
              break;
            case 'hoursReportingImpact':
              value = formData.hoursReportingImpact;
              break;
            default:
              value = '';
          }
          // Custom rendering for primaryProject and skip primaryProjectHours
          if (question.category === 'primaryProject') {
            return (
              <div key={question.id}>
                <div className="text-sm text-gray-500 mb-1">{question.title}</div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-lg">{formData.primaryProject.name}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    <Clock size={12} className="mr-1" />
                    {formData.primaryProject.hours} hours
                  </span>
                </div>
              </div>
            );
          }
          if (question.category === 'primaryProjectHours') {
            return null;
          }
          if (!value || (question.category === 'additionalProjects' && (!Array.isArray(value) || value.length === 0))) return null;
          return (
            <div key={question.id}>
              <div className="text-sm text-gray-500 mb-1">{question.title}</div>
              {question.category === 'additionalProjects' ? (
                <div className="flex flex-col gap-2">
                  {Array.isArray(value) && value.length > 0 ? value.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="font-medium text-base">{p.project}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <Clock size={12} className="mr-1" />
                        {p.hours} hours
                      </span>
                    </div>
                  )) : <span className="text-gray-400">None</span>}
                </div>
              ) : (
                <div className="font-medium whitespace-pre-wrap">{String(value)}</div>
              )}
            </div>
          );
        })}
      </div>
      {/* Dynamic Questions */}
      {dynamicQuestions.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-6">
          {dynamicQuestions.map((question) => {
            const answer = formData.answers?.[question.id];
            if (!answer) return null;
            return (
              <div key={question.id}>
                <div className="text-sm text-gray-500 mb-1">{question.title}</div>
                {Array.isArray(answer) ? (
                  <div className="flex flex-wrap gap-2">
                    {answer.map((val, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200"
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="font-medium whitespace-pre-wrap">{String(answer)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
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