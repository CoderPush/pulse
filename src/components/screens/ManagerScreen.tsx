import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, User, X } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';

const managers = [
  'jane@company.com',
  'john@company.com',
  'michael@company.com',
  'sarah@company.com'
];

export default function ManagerScreen({ onNext, onBack, formData, setFormData }: ScreenProps) {
  const [shouldNavigate, setShouldNavigate] = useState(false);

  useEffect(() => {
    if (shouldNavigate) {
      onNext();
      setShouldNavigate(false);
    }
  }, [shouldNavigate, onNext]);

  const handleManagerChange = (manager: string) => {
    setFormData({
      ...formData,
      manager
    });
  };

  const handleManagerSelect = (manager: string) => {
    handleManagerChange(manager);
    setShouldNavigate(true);
  };

  return (
    <div className="flex flex-col h-full px-6">
      <h2 className="text-2xl font-bold mb-8">Who&apos;s your manager right now? <span className="text-red-500 ml-1">*</span></h2>
      
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Type a name or email..."
            value={formData.manager}
            onChange={(e) => handleManagerChange(e.target.value)}
            className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {formData.manager && (
            <button 
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              onClick={() => handleManagerChange('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {formData.manager && managers.some(m => m.includes(formData.manager.toLowerCase())) && (
          <div 
            className="bg-gray-100 p-3 rounded cursor-pointer hover:bg-gray-200 flex items-center gap-3"
            onClick={() => handleManagerSelect(managers.find(m => m.includes(formData.manager.toLowerCase())) || '')}
          >
            <div className="bg-gray-300 rounded-full p-1">
              <User size={16} />
            </div>
            {managers.find(m => m.includes(formData.manager.toLowerCase()))}
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-500 pb-4">
        Helps us spot confusion in reporting lines.
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
          disabled={!formData.manager}
        >
          Next <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
} 