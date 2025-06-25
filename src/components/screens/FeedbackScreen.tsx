import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';

export default function FeedbackScreen({ onNext, onBack, formData, setFormData, readOnly = false, hideButton = false }: ScreenProps) {
  const handleFeedbackChange = (feedback: string) => {
    setFormData({
      ...formData,
      feedback
    });
  };

  return (
    <div className="flex flex-col h-full px-6">
      <h2 className="text-2xl font-bold mb-8">Any blockers, changes, or feedback this week?</h2>
      
      <div className="mb-6">
        <textarea
          placeholder="Write something..."
          value={formData.feedback}
          onChange={(e) => handleFeedbackChange(e.target.value)}
          className="w-full p-4 border rounded-lg min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={500}
          readOnly={readOnly}
        />
        <div className="flex justify-end text-sm text-gray-500 mt-2">
          {formData.feedback.length}/500 characters
        </div>
      </div>
      
      <div className="text-sm text-gray-600 italic">
        Optional but appreciated
      </div>
      
      {!hideButton && (
        <div className="mt-auto flex gap-3">
          <button 
            onClick={onBack}
            className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2"
            disabled={readOnly}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <button 
            onClick={onNext}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={readOnly}
          >
            Next <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
} 