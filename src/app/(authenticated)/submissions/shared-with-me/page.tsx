"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Book, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Submission = {
  id: string;
  title: string;
  created_at: string;
  status: string;
  is_late?: boolean;
  submitted_at?: string;
  manager?: string;
  form_completion_time?: number;
  primary_project_name?: string;
  primary_project_hours?: number;
  additional_projects?: { name: string; hours: number }[];
  feedback?: string;
  changes_next_week?: string;
  milestones?: string;
  other_feedback?: string;
  hours_reporting_impact?: string;
  user_id: string;
  week_number?: number;
  users?: { email?: string; name?: string } | null;
};

export default function SharedWithMePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/submissions/shared-with-me")
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(data.submissions || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center items-center h-40 text-muted-foreground">Loading...</div>;

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
        <span className="inline-flex items-center justify-center rounded-full bg-green-100 p-6 shadow-md">
          <Star className="w-12 h-12 text-green-500" />
        </span>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Nothing shared with you yet!</h2>
        <p className="text-muted-foreground max-w-md">
          When admin shares a submission with you, it will show up here. Check back soon or keep up the great work!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold mb-2">Submissions Shared With Me</h1>
      {submissions.map((submission) => (
        <Card key={submission.id} className="w-full shadow-lg border-primary/10">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-xl text-blue-700 dark:text-blue-300">
                  {submission.users?.email || "Unknown email"} &mdash; {submission.week_number ? `Week ${submission.week_number}` : "Unknown week"}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                  {submission.status}
                </Badge>
                {submission.is_late && <Badge variant="destructive">Late</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Primary Project */}
            <div className="relative flex items-center bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl shadow-xl border-l-8 border-sky-400 p-6 mb-4 overflow-visible">
              <Star className="w-7 h-7 text-sky-400 mr-4" />
              <div className="flex-1 flex items-center justify-between">
                <h3 className="font-bold text-lg text-blue-900 mb-0">{submission.primary_project_name}</h3>
                <span className="bg-yellow-300 text-blue-900 rounded-full px-4 py-2 font-bold shadow ml-2">{submission.primary_project_hours}h</span>
              </div>
            </div>
            {/* Additional Projects */}
            {submission.additional_projects && submission.additional_projects.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-bold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-200">
                  <Book className="w-5 h-5 text-amber-400 dark:text-amber-200" />
                  Additional Projects
                </h4>
                <div className="grid gap-4">
                  {submission.additional_projects.map((proj: { name: string; hours: number }, idx: number) => (
                    <div
                      key={idx}
                      className="relative flex items-center bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl shadow-xl border-l-8 border-amber-400 p-6 overflow-visible"
                    >
                      <Book className="w-6 h-6 text-amber-400 mr-4" />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-bold text-amber-800 text-base mb-0">{proj.name}</span>
                        <span className="bg-sky-200 text-amber-900 rounded-full px-4 py-2 font-bold shadow ml-2">{proj.hours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Meta Info */}
            <div className="grid gap-2 mt-8">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200 text-sm">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">Submitted:</span>
                <span>{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString(undefined, { timeZoneName: 'short' }) : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200 text-sm">
                <User className="w-4 h-4" />
                <span className="font-semibold">Manager:</span>
                <span>{submission.manager}</span>
              </div>
              {submission.form_completion_time && (
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200 text-sm">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">Time to complete:</span>
                  <span>{submission.form_completion_time} min</span>
                </div>
              )}
            </div>
            {/* Feedback, etc. */}
            <div className="grid gap-4 md:grid-cols-2">
              {submission.feedback && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">Feedback</h4>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                    {submission.feedback}
                  </div>
                </div>
              )}
              {submission.changes_next_week && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">Changes Next Week</h4>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                    {submission.changes_next_week}
                  </div>
                </div>
              )}
              {submission.milestones && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">Milestones</h4>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                    {submission.milestones}
                  </div>
                </div>
              )}
              {submission.other_feedback && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">Other Feedback</h4>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                    {submission.other_feedback}
                  </div>
                </div>
              )}
              {submission.hours_reporting_impact && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">Hours Reporting Impact</h4>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line">
                    {submission.hours_reporting_impact}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button asChild variant="outline" size="sm" className="rounded-full px-4 font-bold">
                <Link href={`/submissions/${submission.id}`}>View Detail</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
