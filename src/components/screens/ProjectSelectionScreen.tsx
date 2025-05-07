import { useState, useEffect } from 'react';
import { ArrowRight, Plus, Check } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function ProjectSelectionScreen({ onNext, formData, setFormData, projects = [] }: ScreenProps) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherProject, setOtherProject] = useState('');
  const [shouldNavigate, setShouldNavigate] = useState(false);

  useEffect(() => {
    if (shouldNavigate) {
      onNext();
      setShouldNavigate(false);
    }
  }, [shouldNavigate, onNext]);

  // Check if the current project is not in the predefined list
  useEffect(() => {
    if (formData.primaryProject.name && !projects.some(p => p.name === formData.primaryProject.name)) {
      setShowOtherInput(true);
      setOtherProject(formData.primaryProject.name);
    }
  }, [formData.primaryProject.name, projects]);

  const selectProject = (projectName: string) => {
    setFormData({
      ...formData,
      primaryProject: { name: projectName, hours: 40 }
    });
    setShowOtherInput(false);
    setOtherProject('');
    setShouldNavigate(true);
  };

  const handleOtherProjectSubmit = () => {
    if (otherProject.trim()) {
      selectProject(otherProject.trim());
    }
  };

  const handleOtherClick = () => {
    setShowOtherInput(true);
    setFormData({
      ...formData,
      primaryProject: { name: '', hours: 40 }
    });
  };

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-3">What project did you spend most of your time on? <span className="text-red-500 ml-1">*</span></h2>
        </motion.div>
        
        {/* Projects Grid */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="grid grid-cols-2 gap-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => selectProject(project.name)}
                className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                  formData.primaryProject.name === project.name
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-md'
                    : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${formData.primaryProject.name === project.name ? 'text-blue-700' : 'text-gray-700'}`}>
                      {project.name}
                    </span>
                  </div>
                  {formData.primaryProject.name === project.name && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <button
                onClick={handleOtherClick}
                className={`w-full p-4 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  showOtherInput
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-md'
                    : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
                }`}
              >
                <Plus className={`w-5 h-5 ${showOtherInput ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${showOtherInput ? 'text-blue-700' : 'text-gray-700'}`}>
                  Other
                </span>
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Other Project Input */}
        {showOtherInput && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-100/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter project name..."
                  value={otherProject}
                  onChange={(e) => setOtherProject(e.target.value)}
                  className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
                />
                <button
                  onClick={handleOtherProjectSubmit}
                  disabled={!otherProject.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Add
                </button>
              </div>
            </Card>
          </motion.div>
        )}
        
        <motion.div 
          className="text-sm text-muted-foreground mt-auto mb-6 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          Your confirmation is the way we can keep things up to date.
        </motion.div>
      </div>
      
      <motion.div 
        className="mt-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <button 
          onClick={onNext}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 w-full justify-center transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!formData.primaryProject.name}
        >
          Next <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
} 