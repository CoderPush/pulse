import { createClient } from '@/utils/supabase/server'
import WeeklyPulseForm from '@/components/WeeklyPulseForm'
import { redirect } from 'next/navigation'
import { getMostRecentThursdayWeek } from '@/lib/utils/time'

interface HomeProps {
  searchParams: {
    week?: string;
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Use week from URL params or fallback to most recent Thursday's week
  const weekNumber = searchParams.week ? parseInt(searchParams.week) : getMostRecentThursdayWeek();

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">     
      <WeeklyPulseForm user={user} weekNumber={weekNumber} />
    </main>
  )
}
