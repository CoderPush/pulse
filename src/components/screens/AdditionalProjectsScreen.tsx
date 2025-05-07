import { useState } from 'react';
import { ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { ScreenProps, AdditionalProject } from '@/types/weekly-pulse';

export default function AdditionalProjectsScreen({ onNext, onBack, formData, setFormData, projects = [] }: ScreenProps) {
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

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Any other projects?</h2>
          <p className="text-muted-foreground">Add more projects if you work on multiple</p>
        </div>
        <button
          onClick={onNext}
          className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Primary Project Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-lg border border-blue-100/50 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600">Primary Project</span>
            </div>
            <div className="text-lg font-semibold text-blue-900">{formData.primaryProject.name}</div>
          </div>
          <div className="text-sm font-medium text-blue-600 bg-blue-100/50 px-4 py-2 rounded-full">
            {formData.primaryProject.hours} hrs
          </div>
        </div>
      </div>
      
      {/* Display existing additional projects */}
      {formData.additionalProjects.length > 0 && (
        <div className="mb-6">
          {formData.additionalProjects.map((proj, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
              <div className="flex-1">
                <span className="font-medium">{proj.project}</span>, <span>{proj.hours} hrs</span>
              </div>
              <button 
                onClick={() => removeAdditionalProject(index)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Projects Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Select projects</h3>
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
                className={`p-3 rounded-lg text-left transition-colors ${
                  selectedProject === project.name
                    ? 'bg-blue-200 text-blue-800 border-2 border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {project.name}
              </button>
              {selectedProject === project.name && (
                <div className="flex gap-2 bg-blue-50 p-3 rounded-lg">
                  <input
                    type="number"
                    placeholder="hours"
                    value={projectHours}
                    onChange={(e) => setProjectHours(e.target.value)}
                    min="1"
                    max="80"
                    className="w-80 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button
                    onClick={handleProjectHoursSubmit}
                    disabled={!projectHours}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-sm hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleOtherClick}
              className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${
                showOtherInput
                  ? 'bg-blue-200 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <Plus size={16} />
              Other
            </button>
          </div>
        </div>
      </div>

      {/* Other Project Input - Outside Grid */}
      {showOtherInput && (
        <div className="flex gap-2 bg-blue-50 p-3 rounded-lg mb-6">
          <input
            type="text"
            placeholder="Enter project name..."
            value={otherProject}
            onChange={(e) => setOtherProject(e.target.value)}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <input
            type="number"
            placeholder="hour"
            value={hoursInput}
            onChange={(e) => setHoursInput(e.target.value)}
            min="1"
            max="80"
            className="w-80 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            onClick={handleOtherProjectSubmit}
            disabled={!otherProject.trim() || !hoursInput}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-sm hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      )}
      
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