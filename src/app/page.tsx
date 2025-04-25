import { createClient } from '@/utils/supabase/server'
import WeeklyPulseForm from '@/components/WeeklyPulseForm'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">     
      <WeeklyPulseForm user={user} />
    </main>
  )
}
