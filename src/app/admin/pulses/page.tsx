'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Represents a single pulse survey week and its metadata.
 */
interface PulseWeek {
  /** Calendar year */
  year: number;
  /** Week number within the year (1-52) */
  week_number: number;
  /** Start date of the week being surveyed (ISO string) */
  start_date: string;
  /** End date of the week being surveyed (ISO string) */
  end_date: string;
  /** Date when submissions open (ISO string) */
  submission_start: string;
  /** Regular submission deadline (ISO string) */
  submission_end: string;
  /** Final deadline for late submissions (ISO string) */
  late_submission_end: string;
  /** Total number of submissions received */
  total_submissions?: number;
  /** Percentage of expected submissions received (0-1) */
  completion_rate?: number;
}

export default function PulsesPage() {
  const router = useRouter();
  const [rawWeeks, setRawWeeks] = useState<PulseWeek[]>([]);
  const [weeks, setWeeks] = useState<PulseWeek[]>([]);
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch once
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const response = await fetch('/api/admin/pulses');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch pulse weeks');
        }
        setRawWeeks(data.weeks);
        setError(null);
      } catch (err) {
        setError('Unable to load pulse data. Please try again later.');
        console.error('Error fetching pulse weeks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeeks();
  }, []);

  // Sort locally
  useEffect(() => {
    if (rawWeeks.length === 0) return;
    const sortedWeeks = [...rawWeeks];
    switch (sortBy) {
      case 'latest':
        sortedWeeks.sort(
          (a, b) =>
            b.year !== a.year
              ? b.year - a.year
              : b.week_number - a.week_number
        );
        break;
      case 'week':
        sortedWeeks.sort(
          (a, b) =>
            a.year !== b.year
              ? a.year - b.year
              : a.week_number - b.week_number
        );
        break;
      case 'completion':
        sortedWeeks.sort((a, b) => (b.completion_rate || 0) - (a.completion_rate || 0));
        break;
    }
    setWeeks(sortedWeeks);
  }, [sortBy, rawWeeks]);

  const isCurrentWeek = (week: PulseWeek) => {
    const now = new Date();
    const startDate = new Date(week.start_date);
    const endDate = new Date(week.late_submission_end);
    return now >= startDate && now <= endDate;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-semibold">Pulse Forms</h1>
            </div>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest First</SelectItem>
              <SelectItem value="week">Week Number</SelectItem>
              <SelectItem value="completion">Completion Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading pulse weeks...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeks.map((week) => (
              <Link key={`${week.year}-${week.week_number}`} href={`/admin/pulses/${week.week_number}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">
                      Week {week.week_number}, {week.year}
                    </CardTitle>
                    <Badge variant={isCurrentWeek(week) ? "default" : "secondary"}>
                      {isCurrentWeek(week) ? 'Active' : 'Past'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">
                        <p>Opens: {new Date(week.submission_start).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        <p>Closes: {new Date(week.late_submission_end).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Submissions</span>
                          <span className="font-medium">{week.total_submissions || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Completion</span>
                          <span className="font-medium">
                            {week.completion_rate
                              ? (week.completion_rate < 0.01 && week.completion_rate > 0)
                                ? '<1%'
                                : `${Math.round(week.completion_rate * 100)}%`
                              : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 