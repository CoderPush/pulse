import { ArrowLeft, Check } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';
import { useState } from 'react';

export default function ReviewScreen({ onNext, onBack, formData }: ScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          week_number: formData.weekNumber,
          primary_project: {
            name: formData.primaryProject.name,
            hours: formData.primaryProject.hours,
          },
          additional_projects: formData.additionalProjects,
          manager: formData.manager,
          feedback: formData.feedback,
          changes_next_week: formData.changesNextWeek,
          milestones: formData.milestones,
          other_feedback: formData.otherFeedback,
          hours_reporting_impact: formData.hoursReportingImpact,
          form_completion_time: formData.formCompletionTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      onNext();
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-6">
      <h2 className="text-2xl font-bold mb-8">Review & Submit</h2>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Primary Project</div>
          <div className="font-medium">{formData.primaryProject.name} ({formData.primaryProject.hours} hours)</div>
        </div>
        
        {formData.additionalProjects.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Additional Projects</div>
            {formData.additionalProjects.map((proj, index) => (
              <div key={index} className="font-medium">
                {proj.project}, {proj.hours}
              </div>
            ))}
          </div>
        )}
        
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Manager</div>
          <div className="font-medium">{formData.manager}</div>
        </div>
        
        {formData.feedback && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Notes</div>
            <div className="font-medium">{formData.feedback}</div>
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
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Now'} <Check size={18} />
        </button>
      </div>
    </div>
  );
} 