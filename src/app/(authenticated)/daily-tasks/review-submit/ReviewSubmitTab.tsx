import React, { useState, useEffect, useRef } from "react";
import { DashboardSummary, DashboardFilters } from "../dashboard";
import SubmissionStatus from "../SubmissionStatus";
import type { Task } from "../page";

interface ReviewSubmitTabProps {
    tasks: Task[];
    filterType: 'week' | 'month';
    setFilterType: React.Dispatch<React.SetStateAction<'week' | 'month'>>;
    filterValue: string;
    setFilterValue: React.Dispatch<React.SetStateAction<string>>;
    onTaskUpdate: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
}

interface MonthStatus {
    status: string;
    report?: {
        status: string;
        month: string;
    };
}

const ReviewSubmitTab: React.FC<ReviewSubmitTabProps> = ({
    tasks,
    filterType,
    setFilterType,
    filterValue,
    setFilterValue,
    onTaskUpdate,
    onTaskDelete,
}) => {
    const [monthStatus, setMonthStatus] = useState<MonthStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const hasFetchedRef = useRef(false);
    const lastFilterValueRef = useRef<string>("");

    // Fetch month status when filter changes
    useEffect(() => {
        // Only fetch if filter type is month and value has changed
        if (filterType !== 'month' || !filterValue) {
            setMonthStatus(null);
            return;
        }

        // Prevent duplicate fetches for the same filter value
        if (hasFetchedRef.current && lastFilterValueRef.current === filterValue) {
            return;
        }

        const fetchMonthStatus = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/monthly-reports/status?month=${filterValue}-01`);
                if (res.ok) {
                    const data = await res.json();
                    setMonthStatus(data);
                    hasFetchedRef.current = true;
                    lastFilterValueRef.current = filterValue;
                } else {
                    setMonthStatus({ status: "draft" });
                }
            } catch (error) {
                console.error("Failed to fetch month status:", error);
                setMonthStatus({ status: "draft" });
            } finally {
                setLoading(false);
            }
        };

        fetchMonthStatus();
    }, [filterType, filterValue]);

    // Reset fetch flag when filter value changes
    useEffect(() => {
        if (lastFilterValueRef.current !== filterValue) {
            hasFetchedRef.current = false;
        }
    }, [filterValue]);

    // Callback to refresh status after submission
    const refreshStatus = async () => {
        if (filterType !== 'month' || !filterValue) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/monthly-reports/status?month=${filterValue}-01`);
            if (res.ok) {
                const data = await res.json();
                setMonthStatus(data);
            }
        } catch (error) {
            console.error("Failed to refresh month status:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
            <DashboardFilters
                filterType={filterType}
                setFilterType={setFilterType}
                filterValue={filterValue}
                setFilterValue={setFilterValue}
            />
            {filterType === 'month' && (
                <SubmissionStatus
                    currentMonth={filterValue}
                    status={monthStatus?.status || monthStatus?.report?.status || "draft"}
                    loading={loading}
                    onStatusChange={refreshStatus}
                />
            )}
            <DashboardSummary
                tasks={tasks}
                filterType={filterType}
                filterValue={filterValue}
                onTaskUpdate={onTaskUpdate}
                onTaskDelete={onTaskDelete}
                monthStatus={filterType === 'month' ? (monthStatus?.status || monthStatus?.report?.status) : undefined}
            />
        </div>
    );
};

export default ReviewSubmitTab;
