import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ScreenProps, Question } from '@/types/weekly-pulse';

export default function TimeInputScreen({
  onNext,
  onBack,
  formData,
  setFormData,
  question,
  readOnly = false,
  hideButton = false
}: ScreenProps & { question?: Question }) {
  const handleTimeChange = (minutes: number) => {
    setFormData({
      ...formData,
      formCompletionTime: minutes
    });
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      handleTimeChange(value);
    } else if (e.target.value === '') {
      handleTimeChange(0);
    }
  };

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">
          {question?.title || "How long did it take you to fill this out?"}
          {question?.required && <span className="text-red-500 ml-1">*</span>}
        </h2>
        {question?.description && (
          <p className="text-gray-600 mb-6">{question.description}</p>
        )}
        
        <div className="relative mb-6">
          <input
            type="number"
            min="1"
            placeholder="Enter custom minutes..."
            value={formData.formCompletionTime || ''}
            onChange={handleCustomTimeChange}
            className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly={readOnly}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 5, 10, 15].map((minutes) => (
            <button
              key={minutes}
              onClick={() => !readOnly && handleTimeChange(minutes)}
              className={`p-4 border rounded-lg text-center transition-colors ${
                formData.formCompletionTime === minutes
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:border-blue-500'
              } ${readOnly ? 'cursor-default opacity-80' : ''}`}
              disabled={readOnly}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </div>
      
      {!hideButton && (
        <div className="mt-auto flex gap-3 pt-4">
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
            disabled={!formData.formCompletionTime || readOnly}
          >
            Next <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
} 