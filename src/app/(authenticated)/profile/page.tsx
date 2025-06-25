import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/auth/user";
import { Settings, Bell, Clock, FileText, CalendarCheck2 } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch latest submission
  const { data: latestSubmission, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching latest submission:", error);
  }

  const userInitials = getInitials(user.email);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
            <AvatarFallback className="text-2xl bg-primary/10">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="w-full text-center sm:text-left">
            <h1 className="text-xl sm:text-3xl font-bold mb-2 truncate break-words max-w-full">
              {user.email}
            </h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="md:col-span-2 text-red-600 text-sm mb-4">
          Error loading your latest submission. Please try again later.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Settings className="w-5 h-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>Your basic profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground break-words">
                {user.email}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground italic">Not set</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <p className="text-sm text-muted-foreground italic">Not set</p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Bell className="w-5 h-5" />
              <span>Preferences</span>
            </CardTitle>
            <CardDescription>
              Your notification and display settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Notifications</label>
              <p className="text-sm text-muted-foreground italic">
                Coming soon
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Zone</label>
              <p className="text-sm text-muted-foreground italic">Not set</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Clock className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Your latest submission</CardDescription>
          </CardHeader>
          <CardContent>
            {latestSubmission ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="w-7 h-7 text-green-600" />
                  <span className="text-lg font-bold text-blue-700">
                    Week {latestSubmission.week_number}
                  </span>
                  <span className="rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-semibold px-3 py-1 text-xs dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800 ml-2">
                    {latestSubmission.status}
                  </span>
                  {latestSubmission.is_late && (
                    <span className="rounded-full bg-red-100 text-red-700 border border-red-200 font-semibold px-3 py-1 text-xs ml-2">
                      Late
                    </span>
                  )}
                </div>
                <div className="w-full max-w-md bg-blue-50 dark:bg-blue-950 rounded-xl shadow p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Project:</span>
                    <span className="truncate">
                      {latestSubmission.primary_project_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Hours:</span>
                    <span>{latestSubmission.primary_project_hours}h</span>
                  </div>
                  {latestSubmission.additional_projects.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mt-2 mb-1">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">
                          Additional Projects:
                        </span>
                      </div>
                      <ul className="pl-6 list-disc text-sm">
                        {latestSubmission.additional_projects.map(
                          (
                            proj: { name: string; hours: number },
                            idx: number
                          ) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="font-medium">{proj.name}</span>
                              <span className="text-xs text-blue-700 bg-blue-100 rounded px-2 py-0.5 ml-2">
                                {proj.hours}h
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Manager:</span>
                    <span>{latestSubmission.manager}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarCheck2 className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Submitted:</span>
                    <span>
                      {new Date(latestSubmission.submitted_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Link
                  href="/history"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition"
                >
                  <FileText className="w-4 h-4" />
                  View Submission History
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <CalendarCheck2 className="w-10 h-10 text-blue-400 mb-3" />
                <p className="text-muted-foreground mb-2">
                  No submissions yet.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Submit your pulse!
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
