import { ArrowLeft, Check } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';

export default function ReviewScreen({ onNext, onBack, formData }: ScreenProps) {
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
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button 
          onClick={onNext}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
        >
          Submit Now <Check size={18} />
        </button>
      </div>
    </div>
  );
} 