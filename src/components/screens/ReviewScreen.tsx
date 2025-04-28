import { ArrowLeft, Check } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';
import { useState } from 'react';

export default function ReviewScreen({ onBack, formData, onNext }: ScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Send raw form data to backend
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
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

  return (
    <div className="flex flex-col h-full px-6">
      <h2 className="text-2xl font-bold mb-8">Review & Submit</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">Primary Project</div>
          <div className="font-medium">{formData.primaryProject.name} ({formData.primaryProject.hours} hours)</div>
        </div>
        
        {formData.additionalProjects.length > 0 && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Any other projects?</div>
            {formData.additionalProjects.map((proj, index) => (
              <div key={index} className="font-medium">
                {proj.project} ({proj.hours} hours)
              </div>
            ))}
          </div>
        )}
        
        <div>
          <div className="text-sm text-gray-500 mb-1">Who&apos;s your manager right now?</div>
          <div className="font-medium">{formData.manager}</div>
        </div>
        
        {formData.feedback && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Any blockers, changes, or feedback this week?</div>
            <div className="font-medium">{formData.feedback}</div>
          </div>
        )}

        {formData.changesNextWeek && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Any changes next week?</div>
            <div className="font-medium">{formData.changesNextWeek}</div>
          </div>
        )}

        {formData.otherFeedback && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Anything else to share?</div>
            <div className="font-medium">{formData.otherFeedback}</div>
          </div>
        )}

        {formData.hoursReportingImpact && (
          <div>
            <div className="text-sm text-gray-500 mb-1">How has reporting the hours each week affected you?</div>
            <div className="font-medium">{formData.hoursReportingImpact}</div>
          </div>
        )}

        {formData.formCompletionTime && (
          <div>
            <div className="text-sm text-gray-500 mb-1">How long did it take you to fill this out?</div>
            <div className="font-medium">{formData.formCompletionTime} minutes</div>
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
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center disabled:bg-green-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Now'} <Check size={18} />
        </button>
      </div>
    </div>
  );
} 