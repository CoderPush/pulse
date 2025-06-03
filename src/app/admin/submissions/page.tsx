'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Search, Clock, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubmissionDetailsModal from '@/components/admin/SubmissionDetailsModal';
import { WeeklyPulseSubmission } from '@/types/weekly-pulse';
import { WeekFilter } from '@/components/WeekFilter';
import { useSearchParams } from 'next/navigation';
import { getMostRecentThursdayWeek } from '@/lib/utils/date';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ImportSubmissionsDialog from '@/components/admin/ImportSubmissionsDialog';

// Define a proper Week type
interface WeekOption {
  value: string;
  label: string;
  week_number: number;
  year: number;
}

export default function SubmissionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Submissions</h1>
      </div>
      <Suspense fallback={<div className="py-8 text-center">Loading submissions...</div>}>
        <SubmissionsFilterAndTable />
      </Suspense>
    </div>
  );
}

function SubmissionsFilterAndTable() {
  const [submissions, setSubmissions] = useState<WeeklyPulseSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<WeeklyPulseSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const searchParams = useSearchParams();

  // Extract week and year params for useEffect dependencies
  const weekParam = searchParams.get('week');
  const yearParam = searchParams.get('year');

  // Fetch available weeks for the selector (run only once on mount)
  useEffect(() => {
    async function fetchWeeks() {
      const res = await fetch('/api/admin/pulses');
      const data = await res.json();
      if (data.weeks && data.weeks.length > 0) {
        const weekOptions: WeekOption[] = data.weeks.map((w: WeekOption) => ({
          value: `${w.year}-${w.week_number}`,
          label: `Week ${w.week_number} - ${w.year}`,
          week_number: w.week_number,
          year: w.year,
        }));
        setWeeks(weekOptions);
        // Set default week from query or getMostRecentThursdayWeek
        let defaultWeek = null;
        if (weekParam && yearParam) {
          const [year, week] = [Number(yearParam), Number(weekParam)];
          const found = data.weeks.find((w: { week_number: number; year: number }) => w.week_number === week && w.year === year);
          if (found) defaultWeek = found;
        } else {
          // Use getMostRecentThursdayWeek and current year
          const currentWeek = getMostRecentThursdayWeek();
          const currentYear = new Date().getFullYear();
          defaultWeek = data.weeks.find((w: { week_number: number; year: number }) => w.week_number === currentWeek && w.year === currentYear) || data.weeks[0];
        }
        setSelectedWeek(defaultWeek.week_number);
        setSelectedYear(defaultWeek.year);
      }
    }
    fetchWeeks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update selected week if query param changes
  useEffect(() => {
    if (!weeks.length) return;
    if (weekParam && yearParam) {
      setSelectedWeek(Number(weekParam));
      setSelectedYear(Number(yearParam));
    }
  }, [weekParam, yearParam, weeks]);

  // Fetch submissions for selected week and search query
  useEffect(() => {
    if (!selectedWeek || !selectedYear) return; // Guard: only fetch if both are set
    const debounceTimer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('email', searchQuery);
      params.append('week', String(selectedWeek));
      params.append('year', String(selectedYear));
      fetchSubmissions(params);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedWeek, selectedYear]);

  const fetchSubmissions = async (params: URLSearchParams) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/submissions?${params}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submissions');
      }
      setSubmissions(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmissions([]);
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare WeekFilter options
  const weekOptions = weeks;

  return (
    <>
      <div className="flex justify-between gap-4 w-full max-w-xl ml-auto">
        <Button
          variant="default"
          className="h-full bg-black text-white hover:bg-gray-900"
          onClick={() => setIsImportDialogOpen(true)}
        >
          Import CSV
        </Button>
        <div className="flex justify-between gap-4 w-full max-w-xl ml-auto">
          <WeekFilter weeks={weekOptions} />
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white">User</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Additional Projects</TableHead>
                  <TableHead className="hidden 2xl:table-cell">Manager</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="hidden 2xl:table-cell">Submitted At</TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-4 h-4 mr-1 inline-block" /> Time
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" role="status" aria-label="Loading" />
                        <p className="mt-2">Loading submissions...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-8 w-8 mb-2" />
                        <p>No submissions found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission, index) => (
                    <TableRow key={index}>
                      <TableCell className="sticky left-0 bg-white">{submission.email}</TableCell>
                      <TableCell>{submission.week_number}</TableCell>
                      <TableCell>{submission.primary_project.name}</TableCell>
                      <TableCell>{submission.primary_project.hours}h</TableCell>
                      <TableCell>
                        {submission.additional_projects && submission.additional_projects.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {submission.additional_projects.map((proj, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit"
                              >
                                {proj.name} <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs font-semibold">{proj.hours}h</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="hidden 2xl:table-cell">{submission.manager}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          submission.status === 'On Time' ? 'bg-green-100 text-green-800' :
                          submission.status === 'Late' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden 2xl:table-cell">
                        {new Date(submission.submission_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          {submission.form_completion_time ? `${submission.form_completion_time} min` : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="View Details"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setIsModalOpen(true);
                              }}
                            >
                              <Eye className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Add Comment"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setIsModalOpen(true);
                              }}
                            >
                              <MessageCircle className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add comment</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
      {selectedSubmission && (
        <SubmissionDetailsModal
          submission={selectedSubmission}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubmission(null);
          }}
        />
      )}
      <ImportSubmissionsDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportComplete={() => {
          setIsImportDialogOpen(false);
          // Refresh submissions after import
          if (selectedWeek && selectedYear) {
            const params = new URLSearchParams();
            if (searchQuery) params.append('email', searchQuery);
            params.append('week', String(selectedWeek));
            params.append('year', String(selectedYear));
            fetchSubmissions(params);
          }
        }}
      />
    </>
  );
} 