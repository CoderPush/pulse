import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import CopilotProvider from '@/components/CopilotProvider';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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


  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <NavBar user={user} />
      <CopilotProvider user={user} submissions={submissions || []}>
        <main className="flex-1">
          {children}
        </main>
      </CopilotProvider>
    </div>
  )
};