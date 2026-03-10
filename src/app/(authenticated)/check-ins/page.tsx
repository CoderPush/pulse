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

  const [myDashboard, allDashboard, entries] = await Promise.all([
    getMyProjectsDashboardData(user.id),
    getAllProjectsDashboardData(user.id),
    getProjectCheckinHistory(user.id),
  ]);

  return (
    <CheckinsPageContent
      myProjects={myDashboard.projects}
      allProjects={allDashboard.projects}
      myProjectIds={allDashboard.myProjectIds}
      definitions={allDashboard.definitions}
      historyEntries={entries}
    />
  );
}
