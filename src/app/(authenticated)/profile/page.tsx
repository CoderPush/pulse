import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function getInitials(email?: string): string {
  if (!email) return 'U';
  const parts = email.split('@')[0].split(/[\s._-]+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const userInitials = getInitials(user.email);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Profile Header */}
      <div className="mb-8 text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4">
          <AvatarFallback className="text-2xl bg-primary/10">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold mb-2">{user.email}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 