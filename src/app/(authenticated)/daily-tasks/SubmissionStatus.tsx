import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface SubmissionStatusProps {
    currentMonth: string; // YYYY-MM format
    status?: string; // Status passed from parent
    loading?: boolean; // Loading state from parent
    onStatusChange?: () => void; // Callback when status changes
}

export default function SubmissionStatus({
    currentMonth,
    status = "draft",
    loading = false,
    onStatusChange
}: SubmissionStatusProps) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!confirm("Are you sure you want to submit your time log for this month? You won't be able to edit it afterwards.")) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/monthly-reports/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: `${currentMonth}-01` }),
            });

            if (!res.ok) throw new Error("Failed to submit");

            toast({
                title: "Submitted Successfully",
                description: "Your monthly report has been submitted for review.",
            });

            // Notify parent to refresh status
            onStatusChange?.();
        } catch {
            toast({
                title: "Submission Failed",
                description: "There was an error submitting your report.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-sm text-gray-500">Checking status...</div>;

    return (
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm mb-6">
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Monthly Submission ({currentMonth})</h3>
                <p className="text-sm text-gray-500">
                    {status === "draft"
                        ? "Your report is currently in draft. Submit it when you are done for the month."
                        : status === "submitted"
                            ? "Your report has been submitted and is pending approval."
                            : status === "approved"
                                ? "Your report has been approved."
                                : "Your report was rejected. Please check comments and resubmit."}
                </p>
            </div>
            <div className="flex items-center gap-2">
                {status === "draft" || status === "rejected" ? (
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit for Review
                    </Button>
                ) : (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium ${status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {(status || 'draft').charAt(0).toUpperCase() + (status || 'draft').slice(1)}
                    </div>
                )}
            </div>
        </div>
    );
}
