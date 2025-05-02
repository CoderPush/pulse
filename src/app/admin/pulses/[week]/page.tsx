'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Question {
  id: string;
  title: string;
  description: string;
  type: string;
  required: boolean;
  version: number;
  category: 'project' | 'hours' | 'manager' | 'feedback' | 'impact';
}

interface WeekData {
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  submission_start: string;
  submission_end: string;
  late_submission_end: string;
  total_submissions: number;
  completion_rate: number;
  questions: Question[];
}

export default function PulsePreviewPage({ params }: { params: Promise<{ week: string }> }) {
  const router = useRouter();
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState<string | null>(null);

  useEffect(() => {
    const initParams = async () => {
      try {
        const resolvedParams = await params;
        setWeekNumber(resolvedParams.week);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load params');
      }
    };
    initParams();
  }, [params]);

  useEffect(() => {
    if (!weekNumber) return;

    const fetchWeekData = async () => {
      try {
        const response = await fetch(`/api/admin/pulses/${weekNumber}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch pulse data');
        }

        setWeekData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching pulse data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekData();
  }, [weekNumber]);

  const renderQuestionPreview = (question: Question) => {
    switch (question.type) {
      case 'text':
        return (
          <div className="bg-gray-50 p-4 rounded-md">
            <input
              type="text"
              placeholder="Text input preview"
              className="w-full bg-white border rounded-md px-3 py-2"
              disabled
            />
          </div>
        );
      case 'number':
        return (
          <div className="bg-gray-50 p-4 rounded-md">
            <input
              type="number"
              placeholder="0"
              className="w-full bg-white border rounded-md px-3 py-2"
              disabled
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="bg-gray-50 p-4 rounded-md">
            <textarea
              placeholder="Long text input preview"
              className="w-full bg-white border rounded-md px-3 py-2"
              disabled
            />
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Preview not available</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading pulse data...</p>
      </div>
    );
  }

  if (error || !weekData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error || 'Failed to load pulse data'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/pulses')}
              className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-semibold">
                Week {weekData.week_number}, {weekData.year}
              </h1>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(weekData.submission_start).toLocaleDateString()} - {new Date(weekData.late_submission_end).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Submissions</p>
                  <p className="text-2xl font-semibold">{weekData.total_submissions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-semibold">
                    {Math.round(weekData.completion_rate * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="project" className="space-y-4">
          <TabsList>
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
          </TabsList>

          {['project', 'hours', 'manager', 'feedback', 'impact'].map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-6">
                {weekData.questions
                  .filter((q) => q.category === category)
                  .map((question) => (
                    <Card key={question.id} className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{question.title}</h3>
                          <p className="text-sm text-gray-500">{question.description}</p>
                        </div>
                        <Badge>{question.type}</Badge>
                      </div>
                      
                      {renderQuestionPreview(question)}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{question.required ? 'Required' : 'Optional'}</span>
                        <span>•</span>
                        <span>Version {question.version}</span>
                      </div>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
} 