"use client";

import { useState, useEffect, use, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Edit2, Trash2, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReportComments from "@/components/ReportComments";
import { createClient } from "@/utils/supabase/client";

interface Task {
    id: string;
    task_date: string;
    project: string;
    bucket: string;
    hours: number;
    description: string;
    billable?: boolean;
}

interface MonthlyReportDetail {
    id: string;
    user_id: string;
    user: {
        email: string;
        name: string;
    };
    month: string;
    status: "draft" | "submitted" | "approved" | "rejected";
    total_hours: number;
    billable_hours: number;
    submitted_at: string;
    comments: string;
}

interface TaskSummary {
    totalHours: number;
    billableHours: number;
    totalTasks: number;
    byProject: Record<string, number>;
    byBucket: Record<string, number>;
    billableByProject: Record<string, number>;
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [report, setReport] = useState<MonthlyReportDetail | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Task>>({});
    const [currentUserId, setCurrentUserId] = useState<string>("");
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    
    // Summary state for accurate totals from ALL tasks
    const [summary, setSummary] = useState<TaskSummary>({
        totalHours: 0,
        billableHours: 0,
        totalTasks: 0,
        byProject: {},
        byBucket: {},
        billableByProject: {}
    });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/monthly-reports?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.reports && data.reports.length > 0) {
                    setReport(data.reports[0]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch report", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchTasksForReport = useCallback(async (pageNum: number = 1) => {
        if (!report) return;
        try {
            // Use admin endpoint with user_id and month parameters
            const reportMonth = report.month.substring(0, 7);
            const res = await fetch(`/api/admin/daily-tasks?user=${report.user_id}&month=${reportMonth}&page=${pageNum}`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks || []);
                setTotalPages(data.totalPages || 1);
                setPageSize(data.pageSize || 20);
            }
        } catch (err) {
            console.error("Failed to fetch tasks", err);
        }
    }, [report]);

    // Fetch summary data separately (no pagination) to get accurate totals for ALL tasks
    const fetchSummary = useCallback(async () => {
        if (!report) return;
        try {
            const reportMonth = report.month.substring(0, 7);
            const res = await fetch(`/api/admin/daily-tasks/summary?user=${report.user_id}&month=${reportMonth}`);
            if (res.ok) {
                const data = await res.json();
                setSummary(data.summary || {
                    totalHours: 0,
                    billableHours: 0,
                    totalTasks: 0,
                    byProject: {},
                    byBucket: {},
                    billableByProject: {}
                });
            }
        } catch (err) {
            console.error("Failed to fetch summary", err);
        }
    }, [report]);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        fetchUser();
        fetchReport();
    }, [id, fetchReport]);

    useEffect(() => {
        if (report) {
            fetchTasksForReport(page);
        }
    }, [report, fetchTasksForReport, page]);

    // Fetch summary whenever report changes (independent of page)
    useEffect(() => {
        if (report) {
            fetchSummary();
        }
    }, [report, fetchSummary]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleAction = async (status: "approved" | "submitted" | "draft") => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/monthly-reports/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            const data = await res.json();
            setReport(data.report);
            toast({
                title: status === 'approved' ? 'Report Approved' : 'Report Reopened',
                description: status === 'approved'
                    ? 'The report has been successfully approved.'
                    : 'The report has been reopened for review.',
            });
            router.push("/admin/time-approval");
        } catch {
            toast({
                title: "Action Failed",
                description: "There was an error updating the report.",
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    const startEdit = (task: Task) => {
        setEditingId(task.id);
        setEditForm(task);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId || !editForm) return;
        try {
            const res = await fetch(`/api/daily-tasks/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update task");
            }

            setTasks(prev => prev.map(t => t.id === editingId ? editForm as Task : t));
            setEditingId(null);
            setEditForm({});

            // Recalculate totals
            await fetchReport();
            await fetchSummary();

            toast({
                title: "Task Updated",
                description: "The task has been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                description: error instanceof Error ? error.message : "There was an error updating the task.",
                variant: "destructive",
            });
        }
    };

    const handleTaskDelete = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            const res = await fetch(`/api/daily-tasks/${taskId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to delete task");
            }

            setTasks(prev => prev.filter(t => t.id !== taskId));

            // Recalculate totals
            await fetchReport();
            await fetchSummary();

            toast({
                title: "Task Deleted",
                description: "The task has been deleted successfully.",
            });
        } catch (error) {
            toast({
                title: "Delete Failed",
                description: error instanceof Error ? error.message : "There was an error deleting the task.",
                variant: "destructive",
            });
        }
    };

    // Use summary data for accurate totals from ALL tasks (not just current page)
    const totalHoursFromTasks = summary.totalHours;
    const billableHoursFromTasks = summary.billableHours;

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!report) return <div className="p-8 text-center">Report not found</div>;

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            <Link href="/admin/time-approval" className="flex items-center text-gray-500 hover:text-gray-900 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Link>

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Review Report</h1>
                <div className={`px-4 py-2 rounded-full font-medium ${report.status === 'approved' ? 'bg-green-100 text-green-800' :
                    report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        report.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {report.status.toUpperCase()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Engineer Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Name:</span>
                                <span className="font-medium">{report.user.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Email:</span>
                                <span className="font-medium">{report.user.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Month:</span>
                                <span className="font-medium">{report.month}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Submitted At:</span>
                                <span className="font-medium">{new Date(report.submitted_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hours Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Total Hours</span>
                                <span className="text-2xl font-bold">{totalHoursFromTasks.toFixed(1)}h</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-blue-600">Billable Hours</span>
                                <span className="text-2xl font-bold text-blue-700">{billableHoursFromTasks.toFixed(1)}h</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Hours Breakdown by Project */}
            <Card>
                <CardHeader>
                    <CardTitle>Hours Breakdown by Project</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead className="text-right">Total Hours</TableHead>
                                <TableHead className="text-right">Billable Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(summary.byProject).map(([project, totalHours]) => (
                                <TableRow key={project}>
                                    <TableCell className="font-medium">{project}</TableCell>
                                    <TableCell className="text-right">{totalHours.toFixed(1)}h</TableCell>
                                    <TableCell className="text-right">{(summary.billableByProject[project] || 0).toFixed(1)}h</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Task Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Task Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead className="w-[150px]">Project</TableHead>
                                <TableHead className="w-[120px]">Bucket</TableHead>
                                <TableHead className="w-[80px]">Hours</TableHead>
                                <TableHead className="w-[80px] text-center">Billable</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No tasks found for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((task) => (
                                    <TableRow key={task.id}>
                                        {editingId === task.id ? (
                                            <>
                                                <TableCell>
                                                    <Input
                                                        type="date"
                                                        value={editForm.task_date}
                                                        onChange={e => setEditForm({ ...editForm, task_date: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={editForm.project}
                                                        onChange={e => setEditForm({ ...editForm, project: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={editForm.bucket}
                                                        onChange={e => setEditForm({ ...editForm, bucket: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={editForm.hours}
                                                        onChange={e => setEditForm({ ...editForm, hours: parseFloat(e.target.value) })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={editForm.billable}
                                                        onCheckedChange={c => setEditForm({ ...editForm, billable: c as boolean })}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={editForm.description}
                                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEdit}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={cancelEdit}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell>{task.task_date}</TableCell>
                                                <TableCell className="font-medium">{task.project}</TableCell>
                                                <TableCell className="text-gray-500">{task.bucket}</TableCell>
                                                <TableCell>{task.hours}</TableCell>
                                                <TableCell className="text-center">
                                                    {task.billable ? (
                                                        <Check className="h-4 w-4 mx-auto text-green-500" />
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-md truncate" title={task.description}>
                                                    {task.description}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(task)}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleTaskDelete(task.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    
                    {/* Task count display */}
                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-600">
                            Showing {tasks.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, summary.totalTasks)} of {summary.totalTasks} tasks
                        </div>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={e => {
                                                e.preventDefault();
                                                if (page > 1) handlePageChange(page - 1);
                                            }}
                                            className={page === 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <PaginationItem key={i + 1}>
                                            <PaginationLink
                                                href="#"
                                                isActive={page === i + 1}
                                                onClick={e => {
                                                    e.preventDefault();
                                                    handlePageChange(i + 1);
                                                }}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={e => {
                                                e.preventDefault();
                                                if (page < totalPages) handlePageChange(page + 1);
                                            }}
                                            className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manager Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleAction('approved')}
                                disabled={processing || report.status === 'approved'}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </Button>
                            <Button
                                className="flex-1"
                                variant="destructive"
                                onClick={() => handleAction('draft')}
                                disabled={processing}
                            >
                                <XCircle className="w-4 h-4 mr-2" /> Reopen
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Comments Section */}
            <ReportComments reportId={id} currentUserId={currentUserId} />
        </div>
    );
}
