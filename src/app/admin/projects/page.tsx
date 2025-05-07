import { createClient } from '@/utils/supabase/server'; // Use your existing server client import
import ProjectsList from '@/components/admin/ProjectsList'; // Import the ProjectsList component
import { Separator } from '@/components/ui/separator';

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, is_active')
    .order('name');

  if (error) {
    console.error('Error fetching projects:', error);
    return (
      <div className="p-4">
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive">
          Error loading projects. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Projects</h3>
        <p className="text-sm text-muted-foreground">
          Manage your projects and their active status
        </p>
      </div>
      <Separator />
      <ProjectsList projects={projects} /> {/* Use the ProjectsList component */}
    </div>
  );
} 