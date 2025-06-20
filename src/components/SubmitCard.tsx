import { Check } from 'lucide-react';
import { useState } from 'react';
import SuccessScreen from './screens/SuccessScreen';
import { WeeklyPulseFormData } from '@/types/weekly-pulse';

interface SubmitCardProps {
  formData: WeeklyPulseFormData
}

export default function SubmitCard({ 
  formData
}: SubmitCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const submissionData = {
        ...formData,
        endTime: new Date().toISOString(),
      };

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
        throw new Error(data.error || 'Failed to submit form');
      }

      setIsSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
      {isSuccess ? (
        <SuccessScreen />
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center text-gray-800">Ready to Submit</h3>
          {!!error && <p className="mx-2 text-red-500">{error}</p>}
          <button 
          onClick={handleSubmit}
          className="relative bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium flex items-center gap-2 w-full justify-center disabled:bg-blue-400 overflow-hidden group transition-all duration-300 shadow-lg hover:shadow-xl"
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
      )}
    </div>
  );
}