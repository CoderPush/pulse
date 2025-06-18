import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Question, WeeklyPulseFormData } from '@/types/weekly-pulse';

interface MultipleChoiceScreenProps {
  question: Question;
  formData: WeeklyPulseFormData;
  setFormData: (data: WeeklyPulseFormData) => void;
  onNext: () => void;
  onBack: () => void;
  error?: string | null;
  readOnly?: boolean;
  hideButton?: boolean;
}

export default function MultipleChoiceScreen({
  question,
  formData,
  setFormData,
  onNext,
  onBack,
  error,
  readOnly = false,
  hideButton = false
}: MultipleChoiceScreenProps) {
  const isCheckbox = question.type === 'checkbox';
  const value = formData.answers?.[question.id];

  const handleChange = (choice: string, checked?: boolean) => {
    if (isCheckbox) {
      const prev: string[] = Array.isArray(value) ? value : [];
      let next: string[];
      if (checked) {
        next = [...prev, choice];
      } else {
        next = prev.filter((v) => v !== choice);
      }
      setFormData({
        ...formData,
        answers: { ...formData.answers, [question.id]: next }
      });
    } else {
      setFormData({
        ...formData,
        answers: { ...formData.answers, [question.id]: choice }
      });
    }
  };

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">{question.title}</h2>
        {question.description && (
          <p className="text-gray-600 mb-6">{question.description}</p>
        )}
        <div className="flex flex-col gap-2">
          {Array.isArray(question.choices) && question.choices.map((choice, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              {isCheckbox ? (
                <input
                  type="checkbox"
                  name={question.id}
                  value={choice}
                  checked={Array.isArray(value) ? value.includes(choice) : false}
                  onChange={e => handleChange(choice, e.target.checked)}
                  className="accent-blue-600"
                  disabled={readOnly}
                />
              ) : (
                <input
                  type="radio"
                  name={question.id}
                  value={choice}
                  checked={value === choice}
                  onChange={() => handleChange(choice)}
                  className="accent-blue-600"
                  disabled={readOnly}
                />
              )}
              <span>{choice}</span>
            </label>
          ))}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mt-4">
            {error}
          </div>
        )}
      </div>
      {!hideButton && (
        <div className="mt-auto flex gap-3 pt-3">
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