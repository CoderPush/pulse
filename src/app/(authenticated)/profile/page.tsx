import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from '@/lib/auth/user'
import { Button } from "@/components/ui/button"
import { Settings, Bell, Clock } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const userInitials = getInitials(user.email);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="text-2xl bg-primary/10">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold mb-2">{user.email}</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>Your basic profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground italic">Not set</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <p className="text-sm text-muted-foreground italic">Not set</p>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <span>Preferences</span>
            </CardTitle>
            <CardDescription>Your notification and display settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Notifications</label>
              <p className="text-sm text-muted-foreground italic">Coming soon</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Zone</label>
              <p className="text-sm text-muted-foreground italic">Not set</p>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Update Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Your recent actions and submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity to show</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 