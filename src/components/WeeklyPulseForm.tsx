'use client';

import { useState } from 'react';
import { WeeklyPulseFormData } from '@/types/weekly-pulse';
import { User } from '@supabase/supabase-js';
import WelcomeScreen from './screens/WelcomeScreen';
import ProjectSelectionScreen from './screens/ProjectSelectionScreen';
import HoursWorkedScreen from './screens/HoursWorkedScreen';
import ManagerScreen from './screens/ManagerScreen';
import AdditionalProjectsScreen from './screens/AdditionalProjectsScreen';
import TextInputScreen from './screens/TextInputScreen';
import TimeInputScreen from './screens/TimeInputScreen';
import ReviewScreen from './screens/ReviewScreen';
import SuccessScreen from './screens/SuccessScreen';
import SubmissionSuccessScreen from './screens/SubmissionSuccessScreen';

interface WeeklyPulseFormProps {
  user: User;
  weekNumber?: number;
  currentYear?: number;
  hasSubmittedThisWeek?: boolean;
  projects: Array<{ id: string; name: string }>;
}

export default function WeeklyPulseForm({
  user,
  weekNumber = 17,
  currentYear,
  hasSubmittedThisWeek = false,
  projects = [],
}: WeeklyPulseFormProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WeeklyPulseFormData>({
    userId: user?.id || '',
    email: user?.email || '',
    weekNumber,
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
    setError(null); // Clear any previous errors
    
    // Validate current screen before proceeding
    const validationError = validateCurrentScreen();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
      if (currentScreen > 0 && currentScreen < totalScreens - 2) {
        setProgress(((currentScreen + 1) / (totalScreens - 2)) * 100);
      }
    }
  };
  
  const handleBack = () => {
    setError(null); // Clear any previous errors
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
      if (currentScreen > 1 && currentScreen < totalScreens - 1) {
        setProgress(((currentScreen - 1) / (totalScreens - 2)) * 100);
      }
    }
  };

  const validateCurrentScreen = (): string | null => {
    switch(currentScreen) {
      case 1: // Project Selection
        if (!formData.primaryProject.name.trim()) {
          return "Please enter a project name";
        }
        break;
      case 2: // Hours Worked
        if (formData.primaryProject.hours <= 0) {
          return "Please enter valid hours worked";
        }
        break;
      case 3: // Manager
        if (!formData.manager.trim()) {
          return "Please enter your manager's name";
        }
        break;
      case 7: // Hours Reporting Impact
        if (!formData.hoursReportingImpact.trim()) {
          return "Please share your experience with hour reporting";
        }
        break;
      default:
        return null;
    }
    return null;
  };
  
  const renderScreen = () => {
    const screenCommonProps = {
      onNext: handleNext,
      onBack: handleBack,
      formData,
      setFormData,
      error,
      projects,
      userId: user.id,
      currentWeekNumber: weekNumber,
      currentYear: currentYear,
    };

    switch(currentScreen) {
      case 0:
        return <WelcomeScreen user={user} onNext={handleNext} weekNumber={weekNumber} />;
      case 1:
        return (
          <ProjectSelectionScreen
            onNext={screenCommonProps.onNext}
            onBack={screenCommonProps.onBack}
            formData={screenCommonProps.formData}
            setFormData={screenCommonProps.setFormData}
            error={screenCommonProps.error}
            projects={screenCommonProps.projects}
            userId={user.id}
            currentWeekNumber={weekNumber}
            currentYear={currentYear}
          />
        );
      case 2:
        return <HoursWorkedScreen {...screenCommonProps} />;
      case 3:
        return <ManagerScreen {...screenCommonProps} />;
      case 4:
        return <AdditionalProjectsScreen {...screenCommonProps} projects={projects} />;
      case 5:
        return <TextInputScreen
          {...screenCommonProps}
          title="Any changes next week?"
          description="Mention further milestones/deadlines if applicable."
          placeholder="Describe any upcoming changes in your work..."
          fieldName="changesNextWeek"
          optional={true}
        />;
      case 6:
        return <TextInputScreen
          {...screenCommonProps}
          title="Anything else to share?"
          description="Wanting more/fewer challenges? Using more/less AI?"
          placeholder="Share any additional thoughts..."
          fieldName="otherFeedback"
          optional={true}
        />;
      case 7:
        return <TextInputScreen
          {...screenCommonProps}
          title="How has reporting the hours each week affected you?"
          placeholder="Share your experience with weekly hour reporting..."
          fieldName="hoursReportingImpact"
        />;
      case 8:
        return <TimeInputScreen {...screenCommonProps} />;
      case 9:
        return <ReviewScreen {...screenCommonProps} />;
      case 10:
        return <SuccessScreen />;
      default:
        return null;
    }
  };
  
  if (hasSubmittedThisWeek) {
    return (
      <div className="flex justify-center items-center w-full h-full min-h-screen py-8">
        <SubmissionSuccessScreen user={user} currentWeek={weekNumber} />
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center w-full h-full min-h-screen py-8">
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

        {/* Error message */}
        {error && (
          <div className="absolute top-4 left-4 right-16 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            {error}
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