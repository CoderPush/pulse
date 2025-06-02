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
import { Button } from '@/components/ui/button';

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
    const field = question.category || question.title || question.id;
    let value: unknown;
    if (field === 'primaryProjectHours') {
      value = formData.primaryProject.hours;
    } else if (field === 'primaryProject') {
      value = formData.primaryProject.name;
    } else if (isWeeklyPulseFormDataKey(field)) {
      value = formData[field as keyof WeeklyPulseFormData];
    } else {
      value = undefined;
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
                fieldName={question.id as string}
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
            return (
              <div className="px-6">
                <div className="mb-4">
                  <div className="text-lg font-semibold mb-2">{question.title}</div>
                  {question.description && <div className="text-gray-500 mb-2">{question.description}</div>}
                  <div className="flex flex-col gap-2">
                    {Array.isArray((question as any).choices) && (question as any).choices.map((choice: string, idx: number) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value={choice}
                          checked={formData.answers?.[question.id] === choice}
                          onChange={() => {
                            setFormData(f => ({
                              ...f,
                              answers: { ...f.answers, [question.id]: choice }
                            }));
                          }}
                          className="accent-blue-600"
                        />
                        <span>{choice}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button onClick={handleNext}>Next</Button>
                </div>
              </div>
            );
          case 'checkbox':
            return (
              <div className="px-6">
                <div className="mb-4">
                  <div className="text-lg font-semibold mb-2">{question.title}</div>
                  {question.description && <div className="text-gray-500 mb-2">{question.description}</div>}
                  <div className="flex flex-col gap-2">
                    {Array.isArray((question as any).choices) && (question as any).choices.map((choice: string, idx: number) => {
                      const prev: string[] = Array.isArray(formData.answers?.[question.id]) ? formData.answers[question.id] as string[] : [];
                      const checked = prev.includes(choice);
                      return (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name={question.id}
                            value={choice}
                            checked={checked}
                            onChange={e => {
                              setFormData(f => {
                                const prev: string[] = Array.isArray(f.answers?.[question.id]) ? f.answers[question.id] as string[] : [];
                                let next: string[];
                                if (e.target.checked) {
                                  next = [...prev, choice];
                                } else {
                                  next = prev.filter((v: string) => v !== choice);
                                }
                                return {
                                  ...f,
                                  answers: { ...f.answers, [question.id]: next }
                                };
                              });
                            }}
                            className="accent-blue-600"
                          />
                          <span>{choice}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button onClick={handleNext}>Next</Button>
                </div>
              </div>
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