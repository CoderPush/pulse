import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HistoryScreen from '@/components/screens/HistoryScreen'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('week_number', { ascending: false })

  const latestSubmission = submissions?.[0] || null

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-gray-100 flex justify-center items-center w-full h-full min-h-screen py-8">
        <HistoryScreen user={user} initialSubmission={latestSubmission} />
      </div>
    </main>
  )
} 