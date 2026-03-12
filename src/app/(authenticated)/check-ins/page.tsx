import { createClient } from '@/utils/supabase/server';
import {
  getAllProjectsDashboardData,
  getMyProjectsDashboardData,
  getProjectCheckinHistory,
} from '@/lib/project-checkins/queries';
import CheckinsPageContent from './components/CheckinsPageContent';

export default async function ProjectCheckinsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [myDashboard, allDashboard, entries, userRow] = await Promise.all([
    getMyProjectsDashboardData(user.id),
    getAllProjectsDashboardData(user.id),
    getProjectCheckinHistory(user.id),
    supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle(),
  ]);
  const isAdmin = !!userRow.data?.is_admin;

  return (
    <CheckinsPageContent
      myProjects={myDashboard.projects}
      allProjects={allDashboard.projects}
      myProjectIds={allDashboard.myProjectIds}
      isAdmin={isAdmin}
      definitions={allDashboard.definitions}
      historyEntries={entries}
    />
  );
}
