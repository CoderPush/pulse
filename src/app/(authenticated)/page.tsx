import { createClient } from '@/utils/supabase/server'
import WeeklyPulseForm from '@/components/WeeklyPulseForm'
import { redirect } from 'next/navigation'
import { getMostRecentThursdayWeek } from '@/lib/utils/date'
import type { User } from '@supabase/supabase-js'

interface HomeProps {
  searchParams: Promise<{
    week?: string;
  }>
}

export default async function HomePage({ searchParams }: HomeProps) {
  const supabase = await createClient()
  const { data: { user: maybeUser }, } = await supabase.auth.getUser()

  if (!maybeUser) {
    redirect('/auth/login')
  }

  const user: User = maybeUser

  const params = await searchParams
  const weekNumber = params.week ? parseInt(params.week) : getMostRecentThursdayWeek();
  const currentYear = new Date().getFullYear();

  let existingSubmission, projects;

  try {
    // Check if user has already submitted for this week
    const { data: submissionData } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('year', currentYear)
      .eq('week_number', weekNumber)
      .single();
    existingSubmission = submissionData;

    // Fetch active projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    projects = projectsData;
  } catch (error) {
    console.error('Error fetching data:', error);
    // TODO: Implement proper error handling and user feedback
  }

  return (
    <div className="w-full px-4">
      <WeeklyPulseForm 
        user={user} 
        weekNumber={weekNumber} 
        currentYear={currentYear}
        hasSubmittedThisWeek={!!existingSubmission}
        projects={projects || []}
      />
    </div>
  )
}
