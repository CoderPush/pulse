'use client';

import { useState, useEffect, useMemo } from 'react';
import { WeeklyPulseFormData, Question, WeeklyPulseSubmission } from '@/types/weekly-pulse';
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
import { useCopilotReadable, useCopilotAction, useCopilotAdditionalInstructions } from '@copilotkit/react-core';
import { motion } from 'framer-motion';
import SubmitCard from './SubmitCard';

interface WeeklyPulseFormProps {
  user: User;
  weekNumber?: number;
  currentYear?: number;
  hasSubmittedThisWeek?: boolean;
  projects: Array<{ id: string; name: string }>;
  previousSubmission?: WeeklyPulseSubmission;
}

export default function WeeklyPulseForm({
  user,
  weekNumber = getISOWeek(new Date()),
  currentYear,
  hasSubmittedThisWeek = false,
  projects = [],
  previousSubmission,
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

  useCopilotAdditionalInstructions({ instructions:
    screenNameToScreenNumberMapping ? `
    The following tools are available for interacting with the Weekly Pulse Form:

    1. navigateToScreenAction:
      Used to navigate between form screens. Parameters:
      - screenName: string - Name of screen to navigate to. The avaible screens are ${Object.keys(screenNameToScreenNumberMapping).join(', ')}
      ONLY CALL WHEN THE USER EXPLICITLY SAY THEY START FILLING THE FORM
      MUST BE CALLED WHENEVER ASKING USER NEW QUESTION 
      MUST NAVIAGE TO 'review' SCREEN WHENEVER DISPLAYING SUMMARY OF THE SUBMISSION TO USER
      NOTIFY THE USER WHEN YOU NAVIGATE TO A NEW SCREEN

    2. navigateToSubmitScreen:
      Used to navigate to the submit screen. Parameters: None
      MUST BE CALLED WHENEVER ASKING USER TO SUBMIT THE FORM

    2. weeklyPulseFormAction:
      Used to update form data fields. Parameters:
      - primaryProject: string - Primary project name
      - primaryProjectHours: number - Hours worked on primary project 
      - managerName: string - Manager's email (e.g. john@coderpush.com)
      - knowsManager: boolean - Whether user knows their manager
      - additionalProjects: Array<{project: string, hours: number}> - Additional projects
      - noAdditionalProject: boolean - Whether user has other projects
      - changesNextWeek: string - Planned changes for next week
      - otherFeedback: string - Week's work feedback
      - hoursReportingImpact: string - Impact of hours reporting
      MUST BE CALLED AFTER USER ANSWERS QUESTION

    Example usage:
    1. Navigate to manager screen:
    navigateToScreenAction({screenName: "manager"})

    2. Submitting the form:
    navigateToSubmitScreen()

    2. Update primary project:
    weeklyPulseFormAction({primaryProject: "Project A", primaryProjectHours: 40})
    ` : ""
  }, [screenNameToScreenNumberMapping]);

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

  // Make Previous Submission's Data readable by the AI
  useCopilotReadable({
    description: "Previous submission's data",
    value: previousSubmission
  }, [previousSubmission]);

  // Define all AI actions for the weekly pulse form
  useCopilotAction({
    name: "weeklyPulseFormAction",
    description: "Actions for completing the weekly pulse form",
    parameters: [
      {
        name: "primaryProject",
        type: "string",
        required: false,
        description: "The name of the primary project the user worked on this week"
      },
      {
        name: "primaryProjectHours",
        type: "number",
        required: false,
        description: "The number of hours spent on the primary project this week"
      },
      {
        name: "managerName",
        type: "string",
        required: false,
        description: "The email of the user's manager such as john_doe@coderpush.com"
      },
      {
        name: "knowsManager",
        type: "boolean",
        required: false,
        description: "Whether the user knows their manager's name"
      },
      {
        name: "additionalProjects",
        type: "object[]",
        required: false,
        description: "List of additional projects worked on this week with hours",
        attributes: [
          {
            name: "project",
            type: "string",
            description: "The project name"
          },
          {
            name: "hours", 
            type: "number",
            description: "Number of hours worked on the project"
          }        
        ]
      },
      {
        name: "noAdditionalProject",
        type: "boolean",
        required: false,
        description: "Whether the user has additional projects to report"
      },
      {
        name: "changesNextWeek",
        type: "string",
        required: false,
        description: "Changes or improvements planned for next week"
      },
      {
        name: "otherFeedback",
        type: "string",
        required: false,
        description: "Feedback about the week's work"
      },
      {
        name: "hoursReportingImpact",
        type: "string",
        required: false,
        description: "Impact of hours reporting on the user's work"
      }
    ],
    handler: async (action) => {
      const updatedFormData = { ...formData };
      
      if (action.primaryProject !== undefined) {
        updatedFormData.primaryProject.name = action.primaryProject;
      }

      if (action.primaryProjectHours !== undefined) {
        updatedFormData.primaryProject.hours = action.primaryProjectHours;
      }

      if (action.knowsManager === false) {
        updatedFormData.manager = "I don't know";
      }

      if (action.managerName !== undefined) {
        updatedFormData.manager = action.managerName;
      }

      if (action.noAdditionalProject) {
        updatedFormData.additionalProjects = [];
      } else if (action.additionalProjects !== undefined) {
        updatedFormData.additionalProjects = action.additionalProjects;
      }

      if (action.changesNextWeek !== undefined) {
        updatedFormData.changesNextWeek = action.changesNextWeek;
      }

      if (action.otherFeedback !== undefined) {
        updatedFormData.otherFeedback = action.otherFeedback;
      }

      if (action.hoursReportingImpact !== undefined) {
        updatedFormData.hoursReportingImpact = action.hoursReportingImpact;
      }
        
      setFormData(updatedFormData);
      return { success: true, message: `Action completed successfully` };
    },
  }, [formData, setFormData]);

  // Create a copilot action to navigate to right screen
  useCopilotAction({
    name: "navigateToScreenAction",
    description: "Actions for navigating to a specific screen in the form which corresponds to the current question.",
    parameters: [
      {
        name: "screenName",
        type: "string",
        required: true,
        description: "The name of screen to that corresponds to the current question"
      }
    ],
    handler: async (action) => {
      const screenName = action.screenName;
      if (screenName && screenNameToScreenNumberMapping[screenName]!= undefined) {
        if(screenNameToScreenNumberMapping[screenName] < totalScreens - 1) handleNext(screenNameToScreenNumberMapping[screenName]);
        const screen = screenNameToScreenNumberMapping[screenName];
        return { success: true, message: `Navigated to screen ${screen}` };
      }
      return {
        success: false,
        message: `Screen ${screenName} not found`
      }
    },
    render: (props) => {
      const screenName = props.args.screenName;
      if (!screenName || !screenNameToScreenNumberMapping[screenName] || screenNameToScreenNumberMapping[screenName] === totalScreens - 1) {
        return <></>
      }

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
        readOnly: true,
        hideButton: true, 
      };
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 py-12 flex flex-col h-fit max-h-[400px] lg:max-h-[600px] w-[90vw] lg:w-[400px] rounded-xl border border-neutral-200 shadow-lg overflow-y-auto"
        >
          <DynamicScreen
            questions={questions || []}
            screenCommonProps={screenCommonProps}
            screenNumber={screenNameToScreenNumberMapping[screenName]}
            totalScreens={totalScreens}
            setCurrentScreen={setCurrentScreen}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            error={error}
          />
        </motion.div>
      );
    }
  }, [questions, formData, setFormData, error, projects, weekNumber, currentYear, totalScreens, setCurrentScreen]);

  // Create a copilot action which go to the submit screen when the user want to submi
  useCopilotAction({
    name: "navigateToSubmitScreen",
    description: "Actions for navigating to the submit screen.",
    render: () => {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 h-fit w-[90vw] lg:w-[400px] rounded-xl border border-neutral-200 shadow-lg"
        >
          <SubmitCard formData={formData}/>
        </motion.div>
      );
    }
  }, [formData]);
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

    const nextScreen = targetScreen && targetScreen < totalScreens - 1 
      ? targetScreen 
      : currentScreen + 1;
    
    if (nextScreen < totalScreens - 1) {
      setCurrentScreen(nextScreen);
      if (nextScreen > 0 && nextScreen < totalScreens - 2) {
        setProgress((nextScreen / (totalScreens - 2)) * 100);
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

  const renderScreen = (readOnly = false, hideButton = false) => {
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
      readOnly,
      hideButton
    };
    
    if (currentScreen === 0) {
      return <WelcomeScreen user={user} onNext={handleNext} weekNumber={weekNumber}/>;
    }
    
    // Dynamic question screens
    return <DynamicScreen 
      questions={questions || []} 
      screenCommonProps={screenCommonProps} 
      screenNumber={currentScreen} 
      totalScreens={totalScreens} 
      setCurrentScreen={setCurrentScreen}
      formData={formData}
      setFormData={setFormData}
      onNext={handleNext}
      onBack={handleBack}
      error={error}
    />;
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
    <div className="flex justify-center items-center w-full h-[calc(100vh-4rem)] py-8">
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
        <div className="flex-1 py-12 flex flex-col h-full overflow-y-auto">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
} 

interface DynamicScreenProps {
  questions: Question[];
  screenCommonProps: any; // eslint-disable-line @typescript-eslint/no-explicit-any  
  screenNumber: number;
  totalScreens: number;
  setCurrentScreen: (screen: number) => void;
  formData: any; // eslint-disable-line @typescript-eslint/no-explicit-any  
  setFormData: React.Dispatch<React.SetStateAction<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any  
  onNext: (targetScreen?: number) => void;
  onBack: () => void;
  error: string | null;
}

const DynamicScreen: React.FC<DynamicScreenProps> = ({
  questions,
  screenCommonProps,
  screenNumber,
  totalScreens,
  setCurrentScreen,
  formData,
  setFormData,
  onNext,
  onBack,
  error
}) => {
  if(screenNumber === undefined) return null;
  if (questions && screenNumber > 0 && screenNumber <= questions.length) {
    const question = questions[screenNumber - 1];
    if (!question) return null;

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
      return <AdditionalProjectsScreen {...screenCommonProps} question={question} />;
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
              onNext={onNext}
              onBack={onBack}
              error={error}
            />
          );
        default:
          return <div>Unsupported question type</div>;
      }
    }
    return null;
  }

  if (screenNumber === totalScreens - 2) {
    return <ReviewScreen {...screenCommonProps} questions={questions || []} totalScreens={totalScreens} setCurrentScreen={setCurrentScreen} />;
  }
  if (screenNumber === totalScreens - 1) {
    return <SuccessScreen/>;
  }
  return null;
};