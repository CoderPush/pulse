'use client';

import { useState } from 'react';
import { WeeklyPulseFormData } from '@/types/weekly-pulse';
import { useAuth } from '@/providers/AuthProvider';
import WelcomeScreen from './screens/WelcomeScreen';
import ProjectSelectionScreen from './screens/ProjectSelectionScreen';
import HoursWorkedScreen from './screens/HoursWorkedScreen';
import ManagerScreen from './screens/ManagerScreen';
import AdditionalProjectsScreen from './screens/AdditionalProjectsScreen';
import TextInputScreen from './screens/TextInputScreen';
import TimeInputScreen from './screens/TimeInputScreen';
import ReviewScreen from './screens/ReviewScreen';
import SuccessScreen from './screens/SuccessScreen';

export default function WeeklyPulseForm() {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState<WeeklyPulseFormData>({
    userId: user?.id || '',
    email: user?.email || '',
    weekNumber: 17, // You can make this dynamic
    primaryProject: { name: '', hours: 0 },
    additionalProjects: [],
    manager: '',
    feedback: '',
    changesNextWeek: '',
    milestones: '',
    otherFeedback: '',
    hoursReportingImpact: '',
    formCompletionTime: 0
  });
  
  const totalScreens = 11;
  
  const handleNext = () => {
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
      if (currentScreen > 0 && currentScreen < totalScreens - 2) {
        setProgress(((currentScreen + 1) / (totalScreens - 2)) * 100);
      }
    }
  };
  
  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
      if (currentScreen > 1 && currentScreen < totalScreens - 1) {
        setProgress(((currentScreen - 1) / (totalScreens - 2)) * 100);
      }
    }
  };
  
  const renderScreen = () => {
    const screenProps = {
      onNext: handleNext,
      onBack: handleBack,
      formData,
      setFormData
    };

    switch(currentScreen) {
      case 0:
        return <WelcomeScreen onNext={handleNext} />;
      case 1:
        return <ProjectSelectionScreen {...screenProps} />;
      case 2:
        return <HoursWorkedScreen {...screenProps} />;
      case 3:
        return <ManagerScreen {...screenProps} />;
      case 4:
        return <AdditionalProjectsScreen {...screenProps} />;
      case 5:
        return <TextInputScreen
          {...screenProps}
          title="Any changes next week?"
          description="Mention further milestones/deadlines if applicable."
          placeholder="Describe any upcoming changes in your work..."
          fieldName="changesNextWeek"
          optional={true}
        />;
      case 6:
        return <TextInputScreen
          {...screenProps}
          title="Anything else to share?"
          description="Wanting more/fewer challenges? Using more/less AI?"
          placeholder="Share any additional thoughts..."
          fieldName="otherFeedback"
          optional={true}
        />;
      case 7:
        return <TextInputScreen
          {...screenProps}
          title="How has reporting the hours each week affected you?"
          placeholder="Share your experience with weekly hour reporting..."
          fieldName="hoursReportingImpact"
        />;
      case 8:
        return <TimeInputScreen {...screenProps} />;
      case 9:
        return <ReviewScreen {...screenProps} />;
      case 10:
        return <SuccessScreen />;
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-gray-100 flex justify-center items-center w-full h-full min-h-screen py-8">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md h-full flex flex-col relative overflow-hidden">
        {/* Progress bar */}
        {currentScreen > 0 && currentScreen < totalScreens - 2 && (
          <div className="h-1 bg-gray-100 absolute top-0 left-0 right-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        {/* Screen indicator */}
        {currentScreen > 0 && currentScreen < totalScreens - 2 && (
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