import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }>  }) {
  const supabase = await createClient();
  const { id } = await params;
  const userId = id;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('get_unique_projects_by_user', { user_id_param: userId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const projects = data.map((item: { project: string }) => item.project);

  return NextResponse.json(projects);
}
