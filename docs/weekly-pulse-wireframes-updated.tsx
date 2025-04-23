import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Clock, User, FileText, BarChart3, Calendar, ChevronDown, X, Plus, Trash2 } from 'lucide-react';

export default function WeeklyPulseTracker() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [progress, setProgress] = useState(0);
  const [project, setProject] = useState('');
  const [hours, setHours] = useState(40);
  const [additionalProjects, setAdditionalProjects] = useState([]);
  const [additionalProjectInput, setAdditionalProjectInput] = useState('');
  const [additionalHoursInput, setAdditionalHoursInput] = useState('');
  const [manager, setManager] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  
  const totalScreens = 8; // Updated for the new screen
  
  const projects = [
    'Apollo', 
    'Phoenix', 
    'Athena', 
    'Horizon', 
    'Nexus'
  ];
  
  const managers = [
    'jane@company.com',
    'john@company.com',
    'michael@company.com',
    'sarah@company.com'
  ];
  
  const projectHistory = [
    { week: 15, project: 'Apollo', hours: 38 },
    { week: 14, project: 'Phoenix', hours: 42 },
    { week: 13, project: 'Apollo', hours: 40 }
  ];
  
  const nextScreen = () => {
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
      setProgress(((currentScreen + 1) / (totalScreens - 2)) * 100);
    }
  };
  
  const prevScreen = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
      setProgress(((currentScreen - 1) / (totalScreens - 2)) * 100);
    }
  };
  
  const selectProject = (proj) => {
    setProject(proj);
    setShowDropdown(false);
    setTimeout(nextScreen, 300);
  };
  
  const addAdditionalProject = () => {
    if (additionalProjectInput && additionalHoursInput && !isNaN(parseInt(additionalHoursInput))) {
      setAdditionalProjects([
        ...additionalProjects, 
        { 
          project: additionalProjectInput, 
          hours: parseInt(additionalHoursInput) 
        }
      ]);
      setAdditionalProjectInput('');
      setAdditionalHoursInput('');
    }
  };
  
  const removeAdditionalProject = (index) => {
    const updatedProjects = [...additionalProjects];
    updatedProjects.splice(index, 1);
    setAdditionalProjects(updatedProjects);
  };
  
  const renderScreen = () => {
    switch(currentScreen) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center h-full gap-8 px-6">
            <div className="text-6xl">👋</div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Hi, Anna!</h1>
              <p className="text-gray-600 mb-6">This is your Weekly Pulse for <span className="font-semibold">Week 17</span>. It takes &lt; 2 minutes.</p>
              <p className="text-gray-600">Ready? Let's go</p>
            </div>
            <button 
              onClick={nextScreen}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium flex items-center gap-2 transition-all transform hover:scale-105"
            >
              Start <ArrowRight size={18} />
            </button>
          </div>
        );
        
      case 1:
        return (
          <div className="flex flex-col h-full px-6">
            <h2 className="text-2xl font-bold mb-8">What project did you spend most of your time on?</h2>
            
            <div className="relative mb-6">
              <div 
                className="border rounded-lg p-4 flex justify-between items-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {project ? project : "Search or select a project..."}
                <ChevronDown size={20} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </div>
              
              {showDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                  {/* Recent projects section */}
                  {showProjectHistory && (
                    <div className="p-2 border-b">
                      <div className="text-sm text-gray-500 mb-2 px-2">Recent projects</div>
                      {projectHistory.map((item, i) => (
                        <div 
                          key={i}
                          className="flex items-center justify-between p-2 hover:bg-blue-50 rounded cursor-pointer"
                          onClick={() => selectProject(item.project)}
                        >
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            <span>{item.project}</span>
                          </div>
                          <span className="text-sm text-gray-500">Week {item.week}</span>
                        </div>
                      ))}
                      <div 
                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer p-2"
                        onClick={() => setShowProjectHistory(false)}
                      >
                        Show all projects
                      </div>
                    </div>
                  )}
                  
                  {/* All projects */}
                  <div className="max-h-60 overflow-y-auto">
                    {!showProjectHistory && projects.map((proj, i) => (
                      <div 
                        key={i}
                        className="p-3 hover:bg-blue-50 cursor-pointer"
                        onClick={() => selectProject(proj)}
                      >
                        {proj}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {!showDropdown && (
              <div 
                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1 mb-6"
                onClick={() => setShowProjectHistory(!showProjectHistory)}
              >
                <Clock size={16} />
                {showProjectHistory ? "Hide recent projects" : "Show my recent projects"}
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              This helps us track team allocations.
            </div>
            
            <div className="mt-auto">
              <button 
                onClick={nextScreen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 w-full justify-center"
                disabled={!project}
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="flex flex-col h-full px-6">
            <h2 className="text-2xl font-bold mb-8">How many hours did you work this week?</h2>
            
            <div className="flex flex-col gap-8 mb-8">
              <div className="relative">
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10h</span>
                  <span>80h</span>
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-4xl font-bold">{hours}</span>
                <span className="text-xl text-gray-600 ml-2">hours</span>
              </div>
              
              <div className="flex gap-3 items-center bg-blue-50 p-3 rounded text-sm text-gray-600">
                <div className="p-2 rounded-full bg-blue-100">
                  <BarChart3 size={16} className="text-blue-600" />
                </div>
                <div>Your average is 42 hours per week</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Don't worry, this doesn't replace billable tracking — just a rough pulse.
            </div>
            
            <div className="mt-auto flex gap-3">
              <button 
                onClick={prevScreen}
                className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                onClick={nextScreen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        );
        
      // New screen for additional projects
      case 3:
        return (
          <div className="flex flex-col h-full px-6">
            <h2 className="text-2xl font-bold mb-6">Any other projects?</h2>
            <p className="text-gray-600 mb-6">Some of you work on multiple projects. Use this if applicable.</p>
            
            {/* Display existing additional projects */}
            {additionalProjects.length > 0 && (
              <div className="mb-6">
                {additionalProjects.map((proj, index) => (
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
                onClick={prevScreen}
                className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                onClick={nextScreen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="flex flex-col h-full px-6">
            <h2 className="text-2xl font-bold mb-8">Who's your manager right now?</h2>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type a name or email..."
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {manager && (
                  <button 
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                    onClick={() => setManager('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {manager && managers.some(m => m.includes(manager.toLowerCase())) && (
                <div className="bg-gray-100 p-3 rounded cursor-pointer hover:bg-gray-200 flex items-center gap-3" onClick={() => {
                  setManager(managers.find(m => m.includes(manager.toLowerCase())) || '');
                  setTimeout(nextScreen, 300);
                }}>
                  <div className="bg-gray-300 rounded-full p-1">
                    <User size={16} />
                  </div>
                  {managers.find(m => m.includes(manager.toLowerCase()))}
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Helps us spot confusion in reporting lines.
            </div>
            
            <div className="mt-auto flex gap-3">
              <button 
                onClick={prevScreen}
                className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                onClick={nextScreen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
                disabled={!manager}
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="flex flex-col h-full px-6">
            <h2 className="text-2xl font-bold mb-8">Any blockers, changes, or feedback this week?</h2>
            
            <div className="mb-6">
              <textarea
                placeholder="Write something..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-4 border rounded-lg min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />
              <div className="flex justify-end text-sm text-gray-500 mt-2">
                {feedback.length}/500 characters
              </div>
            </div>
            
            <div className="text-sm text-gray-600 italic">
              Optional but appreciated
            </div>
            
            <div className="mt-auto flex gap-3">
              <button 
                onClick={prevScreen}
                className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                onClick={nextScreen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="flex flex-col h-full px-6">
            <h2 className="text-2xl font-bold mb-8">Review & Submit</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Primary Project</div>
                <div className="font-medium">{project} ({hours} hours)</div>
              </div>
              
              {additionalProjects.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Additional Projects</div>
                  {additionalProjects.map((proj, index) => (
                    <div key={index} className="font-medium">
                      {proj.project}, {proj.hours}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Manager</div>
                <div className="font-medium">{manager}</div>
              </div>
              
              {feedback && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Notes</div>
                  <div className="font-medium">{feedback}</div>
                </div>
              )}
            </div>
            
            <div className="mt-auto flex gap-3">
              <button 
                onClick={prevScreen}
                className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                onClick={nextScreen}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 flex-1 justify-center"
              >
                Submit Now <Check size={18} />
              </button>
            </div>
          </div>
        );
        
      case 7:
        return (
          <div className="flex flex-col items-center justify-center text-center h-full gap-6 px-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">Submission received!</h1>
              <p className="text-gray-600 mb-6">You're helping us all stay in sync 🙌</p>
            </div>
            
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-blue-600" />
                  <span>Your streak</span>
                </div>
                <div className="font-bold">3 weeks</div>
              </div>
              
              <button 
                className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2 justify-center"
              >
                <FileText size={18} /> View My History
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-gray-100 flex justify-center items-center w-full h-full min-h-screen py-8">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md h-full min-h-[600px] flex flex-col relative overflow-hidden">
        {/* Progress bar */}
        {currentScreen > 0 && currentScreen < 7 && (
          <div className="h-1 bg-gray-100 absolute top-0 left-0 right-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        {/* Screen indicator */}
        {currentScreen > 0 && currentScreen < 7 && (
          <div className="absolute top-4 right-4 bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600 font-medium">
            {currentScreen}/{totalScreens - 2}
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 py-12 flex flex-col overflow-y-auto">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
