'use client';

import { useState } from 'react';
import { WeeklyPulseFormData } from '@/types/weekly-pulse';
import WelcomeScreen from './screens/WelcomeScreen';
import ProjectSelectionScreen from './screens/ProjectSelectionScreen';
import HoursWorkedScreen from './screens/HoursWorkedScreen';
import AdditionalProjectsScreen from './screens/AdditionalProjectsScreen';
import ManagerScreen from './screens/ManagerScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import ReviewScreen from './screens/ReviewScreen';
import SuccessScreen from './screens/SuccessScreen';

export default function WeeklyPulseForm() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState<WeeklyPulseFormData>({
    primaryProject: { name: '', hours: 40 },
    additionalProjects: [],
    manager: '',
    feedback: ''
  });
  
  const totalScreens = 7;
  
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
  
  const renderScreen = () => {
    const screenProps = {
      onNext: nextScreen,
      onBack: prevScreen,
      formData,
      setFormData
    };

    switch(currentScreen) {
      case 0:
        return <WelcomeScreen onNext={nextScreen} />;
      case 1:
        return <ProjectSelectionScreen {...screenProps} />;
      case 2:
        return <HoursWorkedScreen {...screenProps} />;
      case 3:
        return <AdditionalProjectsScreen {...screenProps} />;
      case 4:
        return <ManagerScreen {...screenProps} />;
      case 5:
        return <FeedbackScreen {...screenProps} />;
      case 6:
        return <ReviewScreen {...screenProps} />;
      case 7:
        return <SuccessScreen />;
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-gray-100 flex justify-center items-center w-full h-full min-h-screen py-8">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md h-full flex flex-col relative overflow-hidden">
        {/* Progress bar */}
        {currentScreen > 0 && currentScreen < 6 && (
          <div className="h-1 bg-gray-100 absolute top-0 left-0 right-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        {/* Screen indicator */}
        {currentScreen > 0 && currentScreen < 6 && (
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