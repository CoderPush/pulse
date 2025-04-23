import { useState, useEffect } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { ScreenProps } from '@/types/weekly-pulse';

const projects = [
  'Athletica',
  'Capsule Transit',
  'Casebook',
  'Coin Theaters',
  'Commun1ty',
  'Ensign',
  'Inhalio',
  'Joe Coffee',
  'Groopl',
  'Lemonade',
  'Locket',
  'Moneta',
  'R&D',
  'Rsportz',
  'Sleek',
  'Skylab',
  'HR/Ops',
  'Marketing/Sales/Bizdev',
  'Shrimpl',
  'Orchestars'
];

export default function ProjectSelectionScreen({ onNext, formData, setFormData }: ScreenProps) {
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
    if (formData.primaryProject.name && !projects.includes(formData.primaryProject.name)) {
      setShowOtherInput(true);
      setOtherProject(formData.primaryProject.name);
    }
  }, [formData.primaryProject.name]);

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
        <h2 className="text-2xl font-bold mb-6">What project did you spend most of your time on?</h2>
        
        {/* Projects Grid */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Select a project</h3>
          <div className="grid grid-cols-2 gap-3">
            {projects.map((project, i) => (
              <button
                key={i}
                onClick={() => selectProject(project)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  formData.primaryProject.name === project
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {project}
              </button>
            ))}
            <button
              onClick={handleOtherClick}
              className={`p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                showOtherInput ? 'bg-blue-100 text-blue-700' : ''
              }`}
            >
              <Plus size={16} />
              Other
            </button>
          </div>
        </div>

        {/* Other Project Input */}
        {showOtherInput && (
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter project name..."
                value={otherProject}
                onChange={(e) => setOtherProject(e.target.value)}
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleOtherProjectSubmit}
                disabled={!otherProject.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        )}
        
        <div className="text-sm text-gray-500 mt-auto mb-6">
          Your confirmation is the way we can keep things up to date.
        </div>
      </div>
      
      <div className="mt-auto">
        <button 
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 w-full justify-center"
          disabled={!formData.primaryProject.name}
        >
          Next <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
} 