'use client';

import { useState, useEffect } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ImportSubmissionsDialog from '@/components/admin/ImportSubmissionsDialog';

export interface WeekOption {
    value: string;
    label: string;
    week_number: number;
    year: number;
}

interface SubmissionsClientProps {
    initialWeeks: WeekOption[];
    initialSubmissions: WeeklyPulseSubmission[];
    defaultWeek: number;
    defaultYear: number;
}

export default function SubmissionsClient({
    initialWeeks,
    initialSubmissions,
    defaultWeek,
    defaultYear
}: SubmissionsClientProps) {
    const [submissions, setSubmissions] = useState<WeeklyPulseSubmission[]>(initialSubmissions);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState<WeeklyPulseSubmission | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(defaultWeek);
    const [selectedYear, setSelectedYear] = useState<number | null>(defaultYear);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    const searchParams = useSearchParams();

    // Extract week and year params for useEffect dependencies
    const weekParam = searchParams.get('week');
    const yearParam = searchParams.get('year');

    // Update selected week if query param changes
    useEffect(() => {
        if (!initialWeeks.length) return;
        if (weekParam && yearParam) {
            const w = Number(weekParam);
            const y = Number(yearParam);
            if (w !== selectedWeek || y !== selectedYear) {
                setSelectedWeek(w);
                setSelectedYear(y);
            }
        }
    }, [weekParam, yearParam, initialWeeks, selectedWeek, selectedYear]);

    // Fetch submissions for selected week and search query
    useEffect(() => {
        if (!selectedWeek || !selectedYear) return;

        // Avoid fetching if it matches initial props and we haven't changed anything (optional optimization, but tricky with search)
        // Simpler to just fetch when dependencies change.
        // However, on mount, if params match default, we already have data.
        // We should skip the first fetch if data is already there.
        // But `searchQuery` might change.

        // To avoid double fetch on mount (since we passed initialSubmissions), we can use a ref or check if it's the first run.
        // But `useEffect` runs after render.

        // Let's just use the debounce and fetch. If it's the same data, it's fine.
        // But to be "best practice", we should avoid fetching if we just loaded the page with these params.

        // Actually, if we navigate to ?week=X&year=Y, the Server Component fetches it.
        // Then Client Component mounts with that data.
        // Then `useEffect` runs. It sees `selectedWeek` and `selectedYear`.
        // It will fetch again.

        // We can skip the fetch if it matches the initial state and we haven't interacted?
        // Or we can rely on `router.push` to update URL and let Server Component handle it?
        // But we have `searchQuery` which is client-side state usually (unless we push to URL).

        // Current implementation uses client-side fetch for filtering/switching weeks.
        // If I switch week in dropdown, I want to fetch.

        const isInitialMount = typeof window !== 'undefined' &&
            selectedWeek === defaultWeek &&
            selectedYear === defaultYear &&
            searchQuery === '' &&
            submissions === initialSubmissions;

        if (isInitialMount) {
            // We already have the data.
            return;
        }

        const debounceTimer = setTimeout(() => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('email', searchQuery);
            params.append('week', String(selectedWeek));
            params.append('year', String(selectedYear));

            // If we want to update URL without reload:
            // router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            // But let's just fetch for now to keep it responsive.

            fetchSubmissions(params);
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, selectedWeek, selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const weekOptions = initialWeeks;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Submissions</h1>
            </div>

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
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${submission.status === 'On Time' ? 'bg-green-100 text-green-800' :
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
        </div>
    );
}
