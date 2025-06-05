import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import CopilotProvider from '@/components/CopilotProvider';
import UserSubmissionsProvider from '@/components/UserSubmissionsProvider';
import UserInfoProvider from '@/components/UserInfoProvider';
import { getDisplayName } from '@/lib/auth/user';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log('user', user)

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch 20 most recent submissions for the current user
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(20); // Limit to 20 most recent

  if (error) {
    console.error('Error fetching submissions:', error);
  }

  // Compute userName for personalized Copilot greeting
  const userName = getDisplayName(user);

  return (
    <CopilotProvider userName={userName}>
      <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <NavBar user={user} />
        <UserInfoProvider user={user}>
          <UserSubmissionsProvider submissions={submissions || []}>
            <main className="flex-1">{children}</main>
          </UserSubmissionsProvider>
        </UserInfoProvider>
      </div>
    </CopilotProvider>
  )
} 