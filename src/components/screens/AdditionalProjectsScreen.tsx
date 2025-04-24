import { useState } from 'react';
import { ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { ScreenProps, AdditionalProject } from '@/types/weekly-pulse';

export default function AdditionalProjectsScreen({ onNext, onBack, formData, setFormData }: ScreenProps) {
  const [additionalProjectInput, setAdditionalProjectInput] = useState('');
  const [additionalHoursInput, setAdditionalHoursInput] = useState('');

  const addAdditionalProject = () => {
    if (additionalProjectInput && additionalHoursInput) {
      const newProject: AdditionalProject = {
        project: additionalProjectInput,
        hours: parseInt(additionalHoursInput)
      };
      
      setFormData({
        ...formData,
        additionalProjects: [...formData.additionalProjects, newProject]
      });
      
      setAdditionalProjectInput('');
      setAdditionalHoursInput('');
    }
  };

  const removeAdditionalProject = (index: number) => {
    const updatedProjects = [...formData.additionalProjects];
    updatedProjects.splice(index, 1);
    setFormData({
      ...formData,
      additionalProjects: updatedProjects
    });
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
      
      {/* Add new project form */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Project name"
            value={additionalProjectInput}
            onChange={(e) => setAdditionalProjectInput(e.target.value)}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Hours"
            value={additionalHoursInput}
            onChange={(e) => setAdditionalHoursInput(e.target.value)}
            min="1"
            max="80"
            className="w-24 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button 
          onClick={addAdditionalProject}
          disabled={!additionalProjectInput || !additionalHoursInput}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
            additionalProjectInput && additionalHoursInput 
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Plus size={16} /> Add Project
        </button>
      </div>
      
      <div className="text-sm text-gray-500 mb-4">
        Use the format: Project Name, Hours
      </div>
      
      <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-600 mb-8">
        <div className="font-medium mb-1">Example:</div>
        Project A, 2<br />
        Project B, 3
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