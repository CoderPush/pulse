"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export interface MonthlyReport {
    id: string;
    user: {
        email: string;
        name: string;
    };
    month: string;
    status: "draft" | "submitted" | "approved" | "rejected";
    total_hours: number;
    billable_hours: number;
    submitted_at: string;
}

interface TimeApprovalClientProps {
    initialReports: MonthlyReport[];
    defaultMonth: string;
}

export default function TimeApprovalClient({ initialReports, defaultMonth }: TimeApprovalClientProps) {
    const [reports, setReports] = useState<MonthlyReport[]>(initialReports);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [monthFilter, setMonthFilter] = useState(defaultMonth);
    const hasLoadedInitial = useRef(false);

    const fetchReports = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/monthly-reports?month=${monthFilter}`, { signal });
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Request was aborted, ignore
                return;
            }
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    }, [monthFilter]);

    useEffect(() => {
        // Skip initial fetch if we have data and month matches
        if (!hasLoadedInitial.current && monthFilter === defaultMonth) {
            hasLoadedInitial.current = true;
            return;
        }

        const controller = new AbortController();
        fetchReports(controller.signal);
        return () => controller.abort();
    }, [monthFilter, fetchReports, defaultMonth]);

    const filteredReports = reports.filter((report) => {
        const matchesSearch = report.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.user.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || report.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Time Approval</h1>
            </div>

            <div className="flex justify-between gap-4 w-full">
                <div className="flex items-center gap-2">
                    <label htmlFor="month-filter" className="font-medium text-gray-700">
                        Month:
                    </label>
                    <div className="flex gap-2">
                        <Input
                            id="month-filter"
                            type="month"
                            value={monthFilter ? monthFilter.slice(0, 7) : ""}
                            onChange={(e) => setMonthFilter(e.target.value ? `${e.target.value}-01` : "")}
                            className="w-48"
                        />
                        <Button
                            variant="outline"
                            onClick={() => setMonthFilter("")}
                            className={!monthFilter ? "bg-slate-100 border-slate-400" : ""}
                        >
                            All Months
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="status-filter" className="font-medium text-gray-700">
                        Status:
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Monthly Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Engineer</TableHead>
                                <TableHead>Month</TableHead>
                                <TableHead>Total Hrs</TableHead>
                                <TableHead>Billable Hrs</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No reports found for this month.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{report.user.name || "Unknown"}</span>
                                                <span className="text-xs text-gray-500">{report.user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{report.month}</TableCell>
                                        <TableCell>{report.total_hours.toFixed(1)}h</TableCell>
                                        <TableCell>{report.billable_hours.toFixed(1)}h</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.status === "approved"
                                                    ? "bg-green-100 text-green-800"
                                                    : report.status === "rejected"
                                                        ? "bg-red-100 text-red-800"
                                                        : report.status === "submitted"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/time-approval/${report.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
