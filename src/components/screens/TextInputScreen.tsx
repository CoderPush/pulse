import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ScreenProps, WeeklyPulseFormData } from '@/types/weekly-pulse';

interface TextInputScreenProps extends ScreenProps {
  title: string;
  description?: string;
  placeholder: string;
  fieldName: keyof WeeklyPulseFormData;
  maxLength?: number;
  optional?: boolean;
}

export default function TextInputScreen({
  title,
  description,
  placeholder,
  fieldName,
  maxLength = 500,
  optional = false,
  onNext,
  onBack,
  formData,
  setFormData
}: TextInputScreenProps) {
  const handleChange = (value: string) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });
  };

  const currentValue = (formData[fieldName] ?? '') as string;
  const remainingChars = maxLength - currentValue.length;

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {description && (
          <p className="text-gray-600 mb-6">{description}</p>
        )}
        <textarea
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between items-center mt-2 text-sm text-gray-500 pb-4">
          <span>{remainingChars} characters remaining</span>
          {optional && <span>Optional</span>}
        </div>
      </div>
      
      <div className="mt-auto flex gap-3">
        <button 
          onClick={onBack}
          className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button 
          onClick={onNext}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center transition-all duration-200 transform hover:-translate-y-0.5"
        >
          Next <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
} 