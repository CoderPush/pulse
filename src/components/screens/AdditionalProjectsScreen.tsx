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
      <h2 className="text-2xl font-bold mb-6">Any other projects?</h2>
      <p className="text-gray-600 mb-6">Some of you work on multiple projects. Use this if applicable.</p>
      
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
          {projects.map((project) => (
            <div key={project.id} className="flex flex-col gap-2">
              <button
                onClick={() => handleProjectSelect(project.name)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  formData.additionalProjects.some(p => p.project === project.name)
                    ? 'bg-blue-100 text-blue-700'
                    : selectedProject === project.name
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
        >
          Next <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
} 