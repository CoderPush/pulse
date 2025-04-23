import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';

export default function TimeInputScreen({
  onNext,
  onBack,
  formData,
  setFormData
}: ScreenProps) {
  const handleTimeChange = (minutes: number) => {
    setFormData({
      ...formData,
      formCompletionTime: minutes
    });
  };

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">How long did it take you to fill this out?</h2>
        <p className="text-gray-600 mb-6">Quick estimate. Round it. Don&lsquo;t overthink it.</p>
        
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 5, 10, 15].map((minutes) => (
            <button
              key={minutes}
              onClick={() => handleTimeChange(minutes)}
              className={`p-4 border rounded-lg text-center transition-colors ${
                formData.formCompletionTime === minutes
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:border-blue-500'
              }`}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-auto flex gap-3 pt-4">
        <button 
          onClick={onBack}
          className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button 
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
        >
          Next <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
} 