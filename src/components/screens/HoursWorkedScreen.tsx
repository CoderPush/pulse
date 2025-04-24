import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';

export default function HoursWorkedScreen({ onNext, onBack, formData, setFormData }: ScreenProps) {
  const handleHoursChange = (hours: number) => {
    setFormData({
      ...formData,
      primaryProject: {
        ...formData.primaryProject,
        hours
      }
    });
  };

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-6">How many hours did you work this week? <span className="text-red-500 ml-1">*</span></h2>
        
        <div className="flex flex-col gap-8 mb-6">
          <div className="relative">
            <input
              type="range"
              min="10"
              max="80"
              value={formData.primaryProject.hours}
              onChange={(e) => handleHoursChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10h</span>
              <span>80h</span>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-4xl font-bold">{formData.primaryProject.hours}</span>
            <span className="text-xl text-gray-600 ml-2">hours</span>
          </div>
          
          {/* <div className="flex gap-3 items-center bg-blue-50 p-3 rounded text-sm text-gray-600">
            <div className="p-2 rounded-full bg-blue-100">
              <BarChart3 size={16} className="text-blue-600" />
            </div>
            <div>Your average is 42 hours per week</div>
          </div> */}
        </div>
        
        <div className="text-sm text-gray-500 mt-auto mb-6">
          Don&apos;t worry, this doesn&apos;t replace billable tracking — just a rough pulse.
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
        >
          Next <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
} 