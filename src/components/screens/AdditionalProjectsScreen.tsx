import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import { ScreenProps, AdditionalProject, Question } from '@/types/weekly-pulse';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdditionalProjectsScreen({ onNext, onBack, formData, setFormData, projects = [], question }: ScreenProps & { question?: Question }) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherProject, setOtherProject] = useState('');
  const [hoursInput, setHoursInput] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectHours, setProjectHours] = useState('');

  const addAdditionalProject = (projectName: string, hours: number) => {
    const newProject: AdditionalProject = {
      project: projectName,
      hours: hours
    };
    
    if (!formData.additionalProjects.some(p => p.project === projectName)) {
      setFormData({
        ...formData,
        additionalProjects: [...formData.additionalProjects, newProject]
      });
    }
    
    setShowOtherInput(false);
    setOtherProject('');
    setHoursInput('');
    setSelectedProject(null);
    setProjectHours('');
  };

  const removeAdditionalProject = (index: number) => {
    const updatedProjects = [...formData.additionalProjects];
    updatedProjects.splice(index, 1);
    setFormData({
      ...formData,
      additionalProjects: updatedProjects
    });
  };

  const handleOtherProjectSubmit = () => {
    if (otherProject.trim() && hoursInput) {
      addAdditionalProject(otherProject.trim(), parseInt(hoursInput, 10));
    }
  };

  const handleOtherClick = () => {
    setShowOtherInput(true);
    setSelectedProject(null);
  };

  const handleProjectSelect = (project: string) => {
    setSelectedProject(project);
    setShowOtherInput(false);
  };

  const handleProjectHoursSubmit = () => {
    if (selectedProject && projectHours) {
      addAdditionalProject(selectedProject, parseInt(projectHours, 10));
    }
  };

  // Wrap onNext to auto-add pending project or other input before moving on
  const handleNextWithAutoAdd = () => {
    // If a project is selected and hours entered but not added
    if (selectedProject && projectHours && !formData.additionalProjects.some(p => p.project === selectedProject)) {
      addAdditionalProject(selectedProject, parseInt(projectHours, 10));
    }
    // If 'Other' input is filled but not added
    if (showOtherInput && otherProject.trim() && hoursInput && !formData.additionalProjects.some(p => p.project === otherProject.trim())) {
      addAdditionalProject(otherProject.trim(), parseInt(hoursInput, 10));
    }
    onNext();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        handleNextWithAutoAdd();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, selectedProject, projectHours, showOtherInput, otherProject, hoursInput, formData.additionalProjects]);

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto px-4 pt-8 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {question?.title || "Any other projects?"}
            {question?.required && <span className="text-red-500 ml-1">*</span>}
          </h2>
          {question?.description && (
            <p className="text-sm text-gray-500 mt-1">{question.description}</p>
          )}
        </div>
        <button
          onClick={handleNextWithAutoAdd} // Skip is equivalent to Next here
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
        >
          Skip
        </button>
      </motion.div>

      {/* Primary Project Display */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">Primary Project</span>
              </div>
              <div className="text-lg font-semibold text-gray-800">{formData.primaryProject.name}</div>
            </div>
            <div className="text-sm font-medium text-blue-700 bg-blue-100/70 px-3 py-1 rounded-full">
              {formData.primaryProject.hours} hrs
            </div>
          </div>
        </Card>
      </motion.div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2 mb-4">
        {/* Display existing additional projects */}
        {formData.additionalProjects.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{delay: 0.2}}>
            <h3 className="text-md font-semibold text-gray-700 mb-2">Added Projects</h3>
            <AnimatePresence>
              {formData.additionalProjects.map((proj, index) => (
                <motion.div 
                  key={proj.project} // Assuming project names are unique for key here
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: {duration: 0.2} }}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg mb-2 shadow-sm"
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{proj.project}</span>
                    <span className="text-sm text-gray-500 ml-2">({proj.hours} hrs)</span>
                  </div>
                  <button 
                    onClick={() => removeAdditionalProject(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    aria-label="Remove project"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        
        {/* Projects Grid & Other input - Further styling in next steps */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-700 mb-3">Select from existing</h3>
          <div className="grid grid-cols-2 gap-3">
            {projects
              .filter(project => 
                project.name !== formData.primaryProject.name && 
                !formData.additionalProjects.some(p => p.project === project.name)
              )
              .map((project) => (
              <div key={project.id} className="flex flex-col gap-2">
                <button
                  onClick={() => handleProjectSelect(project.name)}
                  className={`p-3 rounded-lg text-left transition-all duration-200 flex items-center justify-between group w-full
                    ${
                      selectedProject === project.name
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                        : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 shadow-sm'
                    }`}
                >
                  <span className='font-medium'>{project.name}</span>
                  {selectedProject === project.name && <Check size={18}/>}
                </button>
                <AnimatePresence>
                {selectedProject === project.name && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200"
                  >
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={projectHours}
                      onChange={(e) => setProjectHours(e.target.value)}
                      min="1"
                      max="80" /* Or remaining hours? For now, simple max */
                      className="flex-1 p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      aria-label={`Hours for ${project.name}`}
                    />
                    <button
                      onClick={handleProjectHoursSubmit}
                      disabled={!projectHours || parseInt(projectHours) <=0}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Add
                    </button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            ))}
            {/* Other Button - Styled like project buttons */}
            <button
              onClick={handleOtherClick}
              className={`p-3 rounded-lg transition-all duration-200 flex items-center gap-2 group w-full
              ${
                showOtherInput
                  ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                  : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 shadow-sm'
              }`}
            >
              <Plus className={`w-5 h-5 ${showOtherInput ? '' : 'text-gray-500 group-hover:text-gray-700'}`} />
              <span className={`font-medium ${showOtherInput ? '' : 'group-hover:text-gray-900'}`}>Other</span>
              {showOtherInput && <Check size={18}/>}
            </button>
          </div>
        </div>

        {/* Other Project Input Card - Animated */}
        <AnimatePresence>
        {showOtherInput && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="p-4 bg-gray-50 border border-gray-200 shadow-inner">
              <h3 className="text-md font-semibold text-gray-700 mb-2">Add New Project</h3>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                <Input
                  type="text"
                  placeholder="Enter project name..."
                  value={otherProject}
                  onChange={(e) => setOtherProject(e.target.value)}
                  className="flex-1 p-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  aria-label="Other project name"
                />
                <Input
                  type="number"
                  placeholder="Hours"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  min="1"
                  max="80" /* Similar to above, simple max */
                  className="sm:w-24 p-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  aria-label="Hours for other project"
                />
                <button
                  onClick={handleOtherProjectSubmit}
                  disabled={!otherProject.trim() || !hoursInput || parseInt(hoursInput) <= 0}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-300 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  Add Project
                </button>
              </div>
            </Card>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
      
      <motion.div 
        className="fixed bottom-0 left-0 right-0 w-full bg-white/80 backdrop-blur-sm p-4 border-t border-gray-200 z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, type: "spring" }} // Adjusted delay
      >
        <div className="max-w-lg mx-auto flex gap-3">
          <button 
            onClick={onBack}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 w-1/3 transition-all duration-200 hover:bg-gray-50 shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <button 
            onClick={handleNextWithAutoAdd}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 w-2/3 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            aria-label="Next step, or press Shift + Enter"
          >
            Next <ArrowRight size={20} /> 
            <span className="hidden sm:inline text-xs opacity-80 ml-2 border border-white/30 px-1.5 py-0.5 rounded-md">Shift + Enter</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
} 