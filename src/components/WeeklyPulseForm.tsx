'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // Create a mapping between question categories and screen numbers
  const screenNameToScreenNumberMapping = useMemo(() => {
    if (!questions) return {};
    
    const mapping: Record<string, number> = {
      'welcome': 0,
      'review': questions.length + 1,
      'success': questions.length + 2
    };
    
    questions.forEach((question, index) => {
      const category = question.category || question.id;
      mapping[category] = index + 1;
    });
    
    return mapping;
  }, [questions]);

  // Make the questions to complete form readable by the AI
  useCopilotReadable(
  {
    description: "Questions to Help User Complete The Weekly Pulse Form",
    value: questions
      ? questions
          .map(
            (q) =>
              `- ${q.title} (${q.type}${q.required ? ", required" : ""}): ${
                q.description
              }${q.choices ? `\n  Options: ${q.choices.join(", ")}` : ""}`
          )
          .join("\n")
      : "",
  },
  [questions]
);
  // Track formData for Copilot readable context
  useCopilotReadable({
    description: "The weekly pulse form fields and their current values",
    value: formData,
  }, [formData]);

  // Add Screen Mapping for Copilot readable context
  useCopilotReadable({
    description: "Mapping of screen's name to screen's number",
    value: screenNameToScreenNumberMapping,
  }, [screenNameToScreenNumberMapping]);
  
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

  // Define all AI actions for the weekly pulse form
  useCopilotAction({
    name: "weeklyPulseFormAction",
    description: "Actions for completing the weekly pulse form",
    parameters: [
      {
        name: "projectName",
        type: "string",
        required: false,
        description: "The name of the primary project the user worked on this week"
      },
      {
        name: "hours",
        type: "number",
        required: false,
        description: "The number of hours spent on the primary project this week"
      },
      {
        name: "managerName",
        type: "string",
        required: false,
        description: "The email of the user's manager such as john@coderpush.com"
      },
      {
        name: "knowsManager",
        type: "boolean",
        required: false,
        description: "Whether the user knows their manager's name"
      },
      {
        name: "projects",
        type: "object[]",
        required: false,
        description: "List of additional projects worked on this week with hours",
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
      },
      {
        name: "feedback",
        type: "string",
        required: false,
        description: "Feedback about the week's work"
      },
      {
        name: "changes",
        type: "string",
        required: false,
        description: "Changes or improvements planned for next week"
      },
      {
        name: "milestones",
        type: "string",
        required: false,
        description: "Key milestones achieved this week"
      },
      {
        name: "impact",
        type: "string",
        required: false,
        description: "Impact of hours reporting on the user's work"
      },
      {
        name: "answers",
        type: "object",
        required: false,
        description: "Answers to dynamic questions by question ID"
      },
      {
        name: "screenName",
        type: "string",
        required: true,
        description: "The name of screen to that corresponds to the current question"
      }
    ],
    handler: async (action) => {
      console.log(action)
      const updatedFormData = { ...formData };
      
      if (action.projectName !== undefined) {
        updatedFormData.primaryProject.name = action.projectName;
      }

      if (action.hours !== undefined) {
        updatedFormData.primaryProject.hours = action.hours;
      }

      if (action.knowsManager === false) {
        updatedFormData.manager = "I don't know";
      }

      if (action.managerName !== undefined) {
        updatedFormData.manager = action.managerName;
      }

      if (action.projects !== undefined) {
        updatedFormData.additionalProjects = action.noAdditionalProject ? [] : action.projects;
      }

      if (action.feedback !== undefined) {
        updatedFormData.feedback = action.feedback;
      }

      if (action.changes !== undefined) {
        updatedFormData.changesNextWeek = action.changes;
      }

      if (action.milestones !== undefined) {
        updatedFormData.milestones = action.milestones;
      }

      if (action.feedback !== undefined) {
        updatedFormData.otherFeedback = action.feedback;
      }

      if (action.impact !== undefined) {
        updatedFormData.hoursReportingImpact = action.impact;
      }

      if (action.answers) {
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
      } 
      
      if (action.screenName 
        && screenNameToScreenNumberMapping[action.screenName] 
        && screenNameToScreenNumberMapping[action.screenName] < totalScreens - 2) {
        handleNext(screenNameToScreenNumberMapping[action.screenName]);
      }

      setFormData(updatedFormData);
      return { success: true, message: `Action completed successfully` };
    },
  });

  // Create a copilot action to navigate to right screen
  // useCopilotAction({
  //   name: "navigateToScreenAction",
  //   description: "Actions for navigating to a specific screen in the form which corresponds to the current question",
  //   parameters: [
  //     {
  //       name: "screenName",
  //       type: "string",
  //       required: true,
  //       description: "The name of screen to that corresponds to the current question"
  //     }
  //   ],
  //   handler: async (action) => {
  //     console.log(action)
  //     const screenName = action.screenName;
  //     if (screenName && screenNameToScreenNumberMapping[screenName]) {
  //       if(screenNameToScreenNumberMapping[screenName] < totalScreens - 2) handleNext(screenNameToScreenNumberMapping[screenName]);
  //       const screen = screenNameToScreenNumberMapping[screenName];
  //       return { success: true, message: `Navigated to screen ${screen}` };
  //     }
  //     return {
  //       success: false,
  //       message: `Screen ${screenName} not found`
  //     }
  //   },
  // });

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
  
  const handleNext = (targetScreen?: number) => {
    setError(null); // Clear any previous errors
    if (currentScreen === 0 && !formData.startTime) {
      setFormData((prev) => ({ ...prev, startTime: new Date().toISOString() }));
    }
    const validationError = validateCurrentScreen();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (currentScreen < totalScreens - 1) {
      let nextScreen = currentScreen + 1
      if (targetScreen && targetScreen < totalScreens) nextScreen = targetScreen
      setCurrentScreen(nextScreen);
      if (nextScreen > 0 && nextScreen < totalScreens - 2) {
        setProgress(((nextScreen) / (totalScreens - 2)) * 100);
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
