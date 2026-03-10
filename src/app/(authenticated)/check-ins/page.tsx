import { createClient } from '@/utils/supabase/server';
import {
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

  const [dashboard, entries] = await Promise.all([
    getMyProjectsDashboardData(user.id),
    getProjectCheckinHistory(user.id),
  ]);

  return (
    <CheckinsPageContent
      dashboardProjects={dashboard.projects}
      definitions={dashboard.definitions}
      historyEntries={entries}
    />
  );
}
