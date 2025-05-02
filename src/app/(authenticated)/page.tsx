import { createClient } from '@/utils/supabase/server'
import WeeklyPulseForm from '@/components/WeeklyPulseForm'
import { redirect } from 'next/navigation'
import { getMostRecentThursdayWeek } from '@/lib/utils/time'

interface HomeProps {
  searchParams: Promise<{
    week?: string;
  }>
}

export default async function HomePage({ searchParams }: HomeProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const weekNumber = params.week ? parseInt(params.week) : getMostRecentThursdayWeek();

  return (
    <div className="w-full px-4 -mt-16">
      <WeeklyPulseForm user={user} weekNumber={weekNumber} />
    </div>
  )
}
