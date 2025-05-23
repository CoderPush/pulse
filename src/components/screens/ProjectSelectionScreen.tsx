import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, Plus, Check, Search, Star } from 'lucide-react';
import { ScreenProps, Question } from '@/types/weekly-pulse';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPreviousWeekPrimaryProject } from '@/app/actions';

export default function ProjectSelectionScreen({ onNext, formData, setFormData, projects = [], userId, currentWeekNumber, currentYear, question }: ScreenProps & { userId?: string; currentWeekNumber?: number; currentYear?: number; question?: Question }) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherProject, setOtherProject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchedPreviousProject, setFetchedPreviousProject] = useState<string | null>(null);
  const [isLoadingPreviousProject, setIsLoadingPreviousProject] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedProjectRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingOtherProjectRef = useRef<string | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (userId && currentWeekNumber && currentYear) {
      setIsLoadingPreviousProject(true);
      getPreviousWeekPrimaryProject(userId, currentWeekNumber, currentYear)
        .then(projectName => {
          setFetchedPreviousProject(projectName);
        })
        .catch(error => {
          console.error("Failed to fetch previous week's project:", error);
          setFetchedPreviousProject(null);
        })
        .finally(() => {
          setIsLoadingPreviousProject(false);
        });
    } else {
      setIsLoadingPreviousProject(false);
    }
  }, [userId, currentWeekNumber, currentYear]);

  useEffect(() => {
    if (!isLoadingPreviousProject && !formData.primaryProject.name && fetchedPreviousProject && projects.some(p => p.name === fetchedPreviousProject)) {
      setFormData({
        ...formData,
        primaryProject: { name: fetchedPreviousProject, hours: 40 }
      });
    }
  }, [isLoadingPreviousProject, fetchedPreviousProject, formData.primaryProject.name, projects, setFormData, formData]);

  useEffect(() => {
    if (formData.primaryProject.name && selectedProjectRef.current) {
      selectedProjectRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [formData.primaryProject.name, filteredProjects]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        if (formData.primaryProject.name || otherProject.trim()) {
          onNext();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, formData.primaryProject.name, otherProject]);

  useEffect(() => {
    const isProjectInList = projects.some(p => p.name === formData.primaryProject.name);
    if (formData.primaryProject.name && !isProjectInList) {
      setShowOtherInput(true);
      setOtherProject(formData.primaryProject.name);
    } else if (showOtherInput && !formData.primaryProject.name) {
      // If other input was shown but no project name is set (e.g. user cleared it), keep it open
    }
  }, [formData.primaryProject.name, projects, showOtherInput]);

  const selectProject = (projectName: string) => {
    setFormData({
      ...formData,
      primaryProject: { name: projectName, hours: 40 }
    });
    setShowOtherInput(false);
    setOtherProject('');
  };

  const handleOtherProjectSubmit = () => {
    if (otherProject.trim()) {
      pendingOtherProjectRef.current = otherProject.trim();
      selectProject(otherProject.trim());
    }
  };

  useEffect(() => {
    if (
      pendingOtherProjectRef.current &&
      formData.primaryProject.name === pendingOtherProjectRef.current
    ) {
      onNext();
      pendingOtherProjectRef.current = null;
    }
  }, [formData.primaryProject.name, onNext]);

  const handleOtherClick = () => {
    setShowOtherInput(true);
    setFormData({
      ...formData,
      primaryProject: { name: '', hours: 40 }
    });
    setOtherProject('');
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i:number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }),
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };
  
  const isSuggested = (projectName: string) => 
    !isLoadingPreviousProject && 
    projectName === fetchedPreviousProject && 
    !searchTerm;

  const isPrefilledFromLastWeek = (projectName: string) => 
    !isLoadingPreviousProject &&
    projectName === fetchedPreviousProject && 
    formData.primaryProject.name === fetchedPreviousProject;

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto px-4 pt-8 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          {question?.title || "What project did you spend most of your time on?"}
          {question?.required && <span className="text-red-500 ml-1">*</span>}
        </h2>
        {question?.description && (
          <p className="text-sm text-gray-500 mt-1">{question.description}</p>
        )}
      </motion.div>

      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
          />
        </div>
      </motion.div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2 mb-4">
        {isLoadingPreviousProject && (
          <div className="text-center py-4 text-gray-500">Loading suggestion...</div>
        )}
        <AnimatePresence>
          {filteredProjects.map((project, index) => {
            const isCurrentSelected = formData.primaryProject.name === project.name;
            return (
              <motion.button
                key={project.id}
                ref={isCurrentSelected ? selectedProjectRef : null}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                onClick={() => selectProject(project.name)}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center justify-between group
                  ${
                    isCurrentSelected
                      ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                      : isSuggested(project.name) && !isPrefilledFromLastWeek(project.name)
                      ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 text-yellow-700'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 shadow-sm'
                  }`}
              >
                <div className="flex items-center">
                  <span className={`font-medium ${isCurrentSelected ? '' : 'group-hover:text-gray-900'}`}>
                    {project.name}
                  </span>
                  {isPrefilledFromLastWeek(project.name) && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center">
                      <Check size={12} className="mr-1" /> Last week&apos;s choice
                    </span>
                  )}
                  {isSuggested(project.name) && !isPrefilledFromLastWeek(project.name) && !isCurrentSelected && (
                    <span className="ml-2 text-xs bg-yellow-400 text-yellow-800 px-2 py-0.5 rounded-full flex items-center">
                      <Star size={12} className="mr-1" /> Suggested
                    </span>
                  )}
                </div>
                {isCurrentSelected && (
                  <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}}>
                    <Check className="w-6 h-6 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        <motion.button
          custom={filteredProjects.length}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
          onClick={handleOtherClick}
          className={`w-full p-4 rounded-xl transition-all duration-200 flex items-center gap-3 group
            ${showOtherInput
              ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
              : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 shadow-sm'
            }`}
        >
          <Plus className={`w-5 h-5 ${showOtherInput ? '' : 'text-gray-500 group-hover:text-gray-700'}`} />
          <span className={`font-medium ${showOtherInput ? '' : 'group-hover:text-gray-900'}`}>
            Other
          </span>
          {showOtherInput && formData.primaryProject.name === '' && (
             <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}}>
               <Check className="w-6 h-6 text-white" />
             </motion.div>
          )}
        </motion.button>

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
                <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                  <Input
                    type="text"
                    placeholder="Enter project name..."
                    value={otherProject}
                    onChange={(e) => setOtherProject(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    aria-label="Other project name"
                  />
                  <button
                    onClick={handleOtherProjectSubmit}
                    disabled={!otherProject.trim()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2"
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
        transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
      >
        <div className="max-w-lg mx-auto">
          <button 
            onClick={onNext}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 w-full transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            disabled={!formData.primaryProject.name && !otherProject.trim()}
            aria-label="Next step, or press Shift + Enter"
          >
            Next <ArrowRight size={20} /> 
            <span className="hidden sm:inline text-xs opacity-80 ml-2 border border-white/30 px-1.5 py-0.5 rounded-md">Shift + Enter</span>
          </button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Your confirmation helps us keep project data up to date.
          </p>
        </div>
      </motion.div>
    </div>
  );
} 