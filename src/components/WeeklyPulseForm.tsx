'use client';

import { useState, useEffect } from 'react';
import { WeeklyPulseFormData, Question } from '@/types/weekly-pulse';
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
import { getISOWeek } from 'date-fns/getISOWeek';
import MultipleChoiceScreen from './screens/MultipleChoiceScreen';
import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import { createWeeklyPulseFormAssistanceGuidePrompt } from '@/lib/prompt';

interface WeeklyPulseFormProps {
  user: User;
  weekNumber?: number;
  currentYear?: number;
  hasSubmittedThisWeek?: boolean;
  projects: Array<{ id: string; name: string }>;
}

export default function WeeklyPulseForm({
  user,
  weekNumber = getISOWeek(new Date()),
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
    formCompletionTime: 0,
    startTime: undefined,
    endTime: undefined,
    answers: {}
  });

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  
  const totalScreens = 1 + (questions?.length || 0) + 2;
  const reviewScreenNum = 1 + (questions?.length || 0)

  // Track formData for Copilot readable context
  useCopilotReadable({
    description: "The weekly pulse form fields and their current values",
    value: formData,
  }, [formData]);

  // Make user information available to the AI
  useCopilotReadable({
    description: "The current user information",
    value: {
      id: user?.id,
      email: user?.email,
      name: user?.email?.split('@')[0] || 'User',
    }
  }, [user]);

  // Make available projects readable by the AI
  useCopilotReadable({
    description: "Available projects that can be selected",
    value: projects
  }, [projects]);

  // Make the guide to complete form readable by the AI
  useCopilotReadable({
    description: "Weekly pulse form questions",
    value: createWeeklyPulseFormAssistanceGuidePrompt(questions || [], user)
  }, [questions, user]);

  // Define the AI action to start filling the form
  useCopilotAction({
    name: "startToFillForm",
    description: "Start filling out the weekly pulse form by advancing from the welcome screen",
    parameters: [
      {
        name: "startForm",
        type: "boolean",
        required: true,
        description: "Set to true to start filling out the form"
      }
    ],
    handler: async (action) => {
      if(currentScreen === 0) handleNext();
      return { success: true, message: "Started filling out the form" };
    },
  });

  // Define the AI action to set primary project
  useCopilotAction({
    name: "setPrimaryProject",
    description: "Set the primary project the user worked on this week",
    parameters: [
      {
        name: "projectName",
        type: "string",
        required: true,
        description: "The name of the primary project the user worked on this week"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      updatedFormData.primaryProject.name = action.projectName;
      setFormData(updatedFormData);
      if(currentScreen < reviewScreenNum) handleNext();
      return { success: true, message: "Primary project set successfully" };
    },
  });

  // Define the AI action to set primary project hours
  useCopilotAction({
    name: "setPrimaryProjectHours",
    description: "Set the number of hours spent on the primary project this week",
    parameters: [
      {
        name: "hours",
        type: "number",
        required: true,
        description: "The number of hours spent on the primary project this week"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      updatedFormData.primaryProject.hours = action.hours;
      setFormData(updatedFormData);
      if(currentScreen < reviewScreenNum) handleNext();
      return { success: true, message: "Primary project hours set successfully" };
    },
  });

  // Define the AI action to set manager
  useCopilotAction({
    name: "setManager",
    description: "Set the user's manager name",
    parameters: [
      {
        name: "managerName",
        type: "string",
        required: true,
        description: "The name of the user's manager"
      },
      {
        name: "knowsManager",
        type: "boolean",
        required: false,
        description: "Whether the user knows their manager's name"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      updatedFormData.manager = action.knowsManager === false ? "I don't know" : action.managerName;
      setFormData(updatedFormData);
      
      // Use setTimeout to ensure state update completes before navigation
      setTimeout(() => {
        if(currentScreen < reviewScreenNum) handleNext();
      }, 30);
    },
  });

  // Define the AI action to set additional projects
  useCopilotAction({
    name: "setAdditionalProjects",
    description: "Set additional projects worked on this week",
    parameters: [
      {
        name: "projects",
        type: "object[]",
        required: true,
        description: "List of additional projects worked on this week with hours.",
        items: {
          type: "object",
          properties: {
            project: { type: "string" },
            hours: { type: "number" }
          }
        }
      },
      {
        name: "noAdditionalProject",
        type: "boolean",
        required: false,
        description: "Whether the user has additional projects to report"      
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      updatedFormData.additionalProjects = action.noAdditionalProject ? action.projects : [];
      setFormData(updatedFormData);
      if(currentScreen < reviewScreenNum) handleNext();
      return { success: true, message: "Additional projects set successfully" };
    },
  });

  // Define the AI action to set feedback
  useCopilotAction({
    name: "setFeedback",
    description: "Set feedback about the week's work",
    parameters: [
      {
        name: "feedback",
        type: "string",
        required: true,
        description: "Feedback about the week's work"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      updatedFormData.feedback = action.feedback;
      setFormData(updatedFormData);
      if(currentScreen < reviewScreenNum) handleNext();
      return { success: true, message: "Feedback set successfully" };
    },
  });

  // Define the AI action to set changes for next week
  useCopilotAction({
    name: "setChangesNextWeek",
    description: "Set changes or improvements planned for next week",
    parameters: [
      {
        name: "changes",
        type: "string",
        required: true,
        description: "Changes or improvements planned for next week"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      updatedFormData.changesNextWeek = action.changes;
      setFormData(updatedFormData);
      if(currentScreen < reviewScreenNum) handleNext();
      return { success: true, message: "Changes for next week set successfully" };
    },
  });

  // Define the AI action to set milestones
  useCopilotAction({
    name: "setMilestones",
    description: "Set key milestones achieved this week",
    parameters: [
      {
        name: "milestones",
        type: "string",
        required: true,
        description: "Key milestones achieved this week"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      updatedFormData.milestones = action.milestones;
      setFormData(updatedFormData);
      if(currentScreen < reviewScreenNum) handleNext();
      return { success: true, message: "Milestones set successfully" };
    },
  });

  // Define the AI action to set other feedback
  useCopilotAction({
    name: "setOtherFeedback",
    description: "Set any other feedback the user wants to provide",
    parameters: [
      {
        name: "feedback",
        type: "string",
        required: true,
        description: "Any other feedback the user wants to provide"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      updatedFormData.otherFeedback = action.feedback;
      setFormData(updatedFormData);
      if(currentScreen < reviewScreenNum) handleNext();
      return { success: true, message: "Other feedback set successfully" };
    },
  });

  // Define the AI action to set hours reporting impact
  useCopilotAction({
    name: "setHoursReportingImpact",
    description: "Set impact of hours reporting on the user's work",
    parameters: [
      {
        name: "impact",
        type: "string",
        required: true,
        description: "Impact of hours reporting on the user's work"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      updatedFormData.hoursReportingImpact = action.impact;
      setFormData(updatedFormData);
      if(currentScreen < reviewScreenNum) handleNext();
      return { success: true, message: "Hours reporting impact set successfully" };
    },
  });

  // Define the AI action to set dynamic answers
  useCopilotAction({
    name: "setDynamicAnswers",
    description: "Set answers to dynamic questions by question ID",
    parameters: [
      {
        name: "answers",
        type: "object",
        required: true,
        description: "Answers to dynamic questions by question ID"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      
      // Ensure we're working with the correct types for the answers
      const typedAnswers: Record<string, string | string[]> = {};
      
      // Process each key in answers
      Object.entries(action.answers).forEach(([key, value]) => {
        // Handle string values
        if (typeof value === 'string') {
          typedAnswers[key] = value;
        } 
        // Handle array values
        else if (Array.isArray(value)) {
          // Ensure all items in the array are strings
          typedAnswers[key] = value.map(item => String(item));
        }
        // Handle other values by converting to string
        else if (value !== null && value !== undefined) {
          typedAnswers[key] = String(value);
        }
      });
      
      // Update the form data with properly typed answers
      updatedFormData.answers = {
        ...updatedFormData.answers,
        ...typedAnswers
      };
      if(currentScreen < reviewScreenNum) handleNext();
      setFormData(updatedFormData);
      return { success: true, message: "Dynamic answers set successfully" };
    },
  });

  useEffect(() => {
    async function fetchQuestions() {
      setLoadingQuestions(true);
      try {
        const res = await fetch('/api/questions');
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch {
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    }
    fetchQuestions();
  }, []);
  
  const handleNext = () => {
    setError(null); // Clear any previous errors
    if (currentScreen === 0 && !formData.startTime) {
      setFormData((prev) => ({ ...prev, startTime: new Date().toISOString() }));
    }
    // const validationError = validateCurrentScreen();
    // if (validationError) {
    //   setError(validationError);
    //   return;
    // }
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
    function isWeeklyPulseFormDataKey(key: string): key is keyof WeeklyPulseFormData {
      return key in formData;
    }
    // Welcome screen and review/success screens don't need validation
    if (currentScreen === 0 || currentScreen === totalScreens - 2 || currentScreen === totalScreens - 1) return null;
    // Dynamic question screens
    const questionIndex = currentScreen - 1;
    const question = questions?.[questionIndex];
    if (!question) return null;
    // Map question field to formData
    const field = question.category || question.id;
    let value: unknown;
    if (field === 'primaryProjectHours') {
      value = formData.primaryProject.hours;
    } else if (field === 'primaryProject') {
      value = formData.primaryProject.name;
    } else if (isWeeklyPulseFormDataKey(field)) {
      value = formData[field as keyof WeeklyPulseFormData];
    } else {
      // Fallback to dynamic answers keyed by question id
      value = formData.answers?.[question.id];
    }
    if (question.required && (
      value === undefined || value === null || (typeof value === 'string' && !value.trim())
    )) {
      return 'This field is required.';
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
      questions,
    };
    if (currentScreen === 0) {
      return <WelcomeScreen user={user} onNext={handleNext} weekNumber={weekNumber} />;
    }
    // Dynamic question screens
    if (questions && currentScreen > 0 && currentScreen <= questions.length) {
      const question = questions[currentScreen - 1];
      if (question.category === 'primaryProject') {
        return <ProjectSelectionScreen {...screenCommonProps} question={question} />;
      }
      if (question.category === 'primaryProjectHours') {
        return <HoursWorkedScreen {...screenCommonProps} question={question} />;
      }
      if (question.category === 'manager') {
        return <ManagerScreen {...screenCommonProps} question={question} />;
      }
      if (question.category === 'additionalProjects') {
        return <AdditionalProjectsScreen {...screenCommonProps} projects={projects} question={question} />;
      }
      if (question.category === 'formCompletionTime') {
        return <TimeInputScreen {...screenCommonProps} question={question} />;
      }
      if (question.category && (question.category in formData)) {
        return (
          <TextInputScreen
            {...screenCommonProps}
            title={question.title}
            description={question.description}
            placeholder={question.description || question.title}
            fieldName={question.category as keyof WeeklyPulseFormData}
            optional={!question.required}
            maxLength={500}
            multiline={true}
          />
        );
      }
      // Dynamic question fallback: render by type
      if (!question.category) {
        switch (question.type) {
          case 'text':
            return (
              <TextInputScreen
                {...screenCommonProps}
                title={question.title}
                description={question.description}
                placeholder={question.description || question.title}
                fieldName={question.id as string}
                optional={!question.required}
                maxLength={500}
                isDynamic
              />
            );
          case 'number':
            return (
              <TextInputScreen
                {...screenCommonProps}
                title={question.title}
                description={question.description}
                placeholder={question.description || question.title}
                fieldName={question.id}
                optional={!question.required}
                type="number"
                isDynamic
              />
            );
          case 'textarea':
            return (
              <TextInputScreen
                {...screenCommonProps}
                title={question.title}
                description={question.description}
                placeholder={question.description || question.title}
                fieldName={question.id as string}
                optional={!question.required}
                multiline
                isDynamic
              />
            );
          case 'multiple_choice':
          case 'checkbox':
            return (
              <MultipleChoiceScreen
                question={question}
                formData={formData}
                setFormData={setFormData}
                onNext={handleNext}
                onBack={handleBack}
                error={error}
              />
            );
          default:
            return <div>Unsupported question type</div>;
        }
      }
      return null;
    }
    if (currentScreen === totalScreens - 2) {
      return <ReviewScreen {...screenCommonProps} questions={questions || []} />;
    }
    if (currentScreen === totalScreens - 1) {
      return <SuccessScreen />;
    }
    return null;
  };
  
  if (loadingQuestions) {
    return (
      <div className="flex justify-center items-center w-full min-h-[calc(100vh-4rem)] py-8">
        <div className="flex flex-col items-center gap-2">
          <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading">
            <span className="sr-only">Loading questions…</span>
          </span>
        </div>
      </div>
    );
  }
  
  if (hasSubmittedThisWeek) {
    return (
      <div className="flex justify-center items-center w-full min-h-[calc(100vh-4rem)] py-8">
        <SubmissionSuccessScreen user={user} currentWeek={weekNumber} />
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center w-full min-h-[calc(100vh-4rem)] py-8">
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
