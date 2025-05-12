import { ArrowRight, ArrowLeft, TrendingUp, Briefcase } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect } from 'react';

export default function HoursWorkedScreen({ onNext, onBack, formData, setFormData }: ScreenProps) {
  const handleHoursChange = (hours: number[]) => {
    setFormData({
      ...formData,
      primaryProject: {
        ...formData.primaryProject,
        hours: hours[0]
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        if (formData.primaryProject.hours) {
          onNext();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, formData.primaryProject.hours]);

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
           <h2 className="text-2xl font-bold mb-3">How many hours did you work this week? <span className="text-red-500 ml-1">*</span></h2>
        </motion.div>
        
        <div className="flex flex-col gap-8 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <div className="text-sm font-medium text-blue-600">Main project</div>
                  </div>
                  <div className="font-semibold text-xl text-blue-900">{formData.primaryProject.name}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-bold text-blue-500">{formData.primaryProject.hours}</div>
                  <div className="text-sm text-blue-600 font-medium">hours</div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="relative">
              <Slider
                defaultValue={[formData.primaryProject.hours]}
                max={80}
                step={1}
                value={[formData.primaryProject.hours]}
                onValueChange={handleHoursChange}
                className="w-full [&_[data-slot=slider-track]]:bg-blue-100 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-blue-500 [&_[data-slot=slider-range]]:to-blue-600 [&_[data-slot=slider-thumb]]:border-blue-600 [&_[data-slot=slider-thumb]]:hover:ring-blue-200 [&_[data-slot=slider-thumb]]:focus-visible:ring-blue-200"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  0h
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> 80h
                </span>
              </div>
            </div>
            
            <motion.div 
              className="text-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.3 }}
              key={formData.primaryProject.hours}
            >
              <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {formData.primaryProject.hours}
              </span>
              <span className="text-xl text-muted-foreground ml-2">hours</span>
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="text-sm text-muted-foreground mt-auto mb-6 flex items-center gap-2"
        >
          Don&apos;t worry, this doesn&apos;t replace billable tracking — just a rough pulse.
        </motion.div>
      </div>
      
      <motion.div 
        className="mt-auto flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <button 
          onClick={onBack}
          className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-all duration-200 hover:bg-gray-50"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button 
          onClick={onNext}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 w-full transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          disabled={!formData.primaryProject.hours}
          aria-label="Next step, or press Shift + Enter"
        >
          Next <ArrowRight size={20} />
          <span className="hidden sm:inline text-xs opacity-80 ml-2 border border-white/30 px-1.5 py-0.5 rounded-md">Shift + Enter</span>
        </button>
      </motion.div>
    </div>
  );
} 