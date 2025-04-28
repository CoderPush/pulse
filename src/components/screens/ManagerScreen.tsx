import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';

export default function ManagerScreen({ onNext, onBack, formData, setFormData }: ScreenProps) {
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [dontKnow, setDontKnow] = useState(false);

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

  const handleDontKnowChange = (checked: boolean) => {
    setDontKnow(checked);
    if (checked) {
      setFormData({
        ...formData,
        manager: 'I don\'t know'
      });
    } else {
      setFormData({
        ...formData,
        manager: ''
      });
    }
  };

  return (
    <div className="flex flex-col h-full px-6">
      <h2 className="text-2xl font-bold mb-8">Who&apos;s your manager right now? </h2>
      
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <input
            type="email"
            placeholder="Enter manager's email..."
            value={formData.manager}
            onChange={(e) => handleManagerChange(e.target.value)}
            className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={dontKnow}
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="dont-know"
            checked={dontKnow}
            onChange={(e) => handleDontKnowChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="dont-know" className="text-sm text-gray-600">
            I don&apos;t know who my manager is
          </label>
        </div>
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