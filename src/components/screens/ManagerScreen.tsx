import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, UserCircle, HelpCircle, Check, Star } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';
import { Card } from "@/components/ui/card";
import { getPreviousWeekManager } from '@/app/actions';

export default function ManagerScreen({ onNext, onBack, formData, setFormData, userId, currentWeekNumber, currentYear }: ScreenProps & { userId?: string; currentWeekNumber?: number; currentYear?: number }) {
  const [dontKnow, setDontKnow] = useState(false);
  const [fetchedPreviousManager, setFetchedPreviousManager] = useState<string | null>(null);
  const [isLoadingPreviousManager, setIsLoadingPreviousManager] = useState(true);

  useEffect(() => {
    if (userId && currentWeekNumber && currentYear) {
      setIsLoadingPreviousManager(true);
      getPreviousWeekManager(userId, currentWeekNumber, currentYear)
        .then(manager => {
          setFetchedPreviousManager(manager);
        })
        .catch(error => {
          console.error("Failed to fetch previous week's manager:", error);
          setFetchedPreviousManager(null);
        })
        .finally(() => {
          setIsLoadingPreviousManager(false);
        });
    } else {
      setIsLoadingPreviousManager(false);
    }
  }, [userId, currentWeekNumber, currentYear]);

  useEffect(() => {
    if (
      !isLoadingPreviousManager &&
      (formData.manager === undefined || formData.manager === null) &&
      fetchedPreviousManager
    ) {
      setFormData({
        ...formData,
        manager: fetchedPreviousManager
      });
    }
  }, [isLoadingPreviousManager, fetchedPreviousManager, formData.manager, setFormData, formData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        if (formData.manager && formData.manager !== '' && !isLoadingPreviousManager) {
          onNext();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, formData.manager, isLoadingPreviousManager]);

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
      <div>
        <h2 className="text-2xl font-bold mb-3">Who&apos;s your manager right now? <span className="text-red-500 ml-1">*</span></h2>
      </div>
      
      <div className="flex flex-col gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-100/50">
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <UserCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Manager&apos;s Email</span>
            </div>
            <input
              type="email"
              placeholder="Enter manager&apos;s email..."
              value={formData.manager}
              onChange={(e) => handleManagerChange(e.target.value)}
              className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
              disabled={dontKnow}
            />
            {isLoadingPreviousManager && (
              <div className="text-xs text-gray-400 mt-2">Loading suggestion...</div>
            )}
            {!isLoadingPreviousManager && fetchedPreviousManager && formData.manager === fetchedPreviousManager && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center mt-2">
                <Check size={12} className="mr-1" /> Last week&apos;s choice
              </span>
            )}
            {!isLoadingPreviousManager && fetchedPreviousManager && formData.manager !== fetchedPreviousManager && formData.manager && (
              <span className="ml-2 text-xs bg-yellow-400 text-yellow-800 px-2 py-0.5 rounded-full flex items-center mt-2">
                <Star size={12} className="mr-1" /> Overridden suggestion
              </span>
            )}
          </div>
        </Card>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="dont-know"
            checked={dontKnow}
            onChange={(e) => handleDontKnowChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="dont-know" className="text-md text-gray-900 cursor-pointer">
            I don&apos;t know who my manager is
          </label>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground mt-auto mb-6 flex items-center gap-2">
        <HelpCircle className="w-4 h-4" />
        Helps us spot confusion in reporting lines.
      </div>
      
      <div className="mt-auto flex gap-3">
        <button 
          onClick={onBack}
          className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-all duration-200 hover:bg-gray-50"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button 
          onClick={onNext}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 w-full transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          disabled={!formData.manager || isLoadingPreviousManager}
          aria-label="Next step, or press Shift + Enter"
        >
          Next <ArrowRight size={20} />
          <span className="hidden sm:inline text-xs opacity-80 ml-2 border border-white/30 px-1.5 py-0.5 rounded-md">Shift + Enter</span>
        </button>
      </div>
    </div>
  );
} 