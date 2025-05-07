import { createClient } from '@/utils/supabase/server'
import WeeklyPulseForm from '@/components/WeeklyPulseForm'
import { redirect } from 'next/navigation'
import { getMostRecentThursdayWeek } from '@/lib/utils/date'

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

  // Check if user has already submitted for this week
  const { data: existingSubmission } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('year', new Date().getFullYear())
    .eq('week_number', weekNumber)
    .single();

  // Fetch active projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="w-full px-4 -mt-16">
      <WeeklyPulseForm 
        user={user} 
        weekNumber={weekNumber} 
        hasSubmittedThisWeek={!!existingSubmission}
        projects={projects || []}
      />
    </div>
  )
}
