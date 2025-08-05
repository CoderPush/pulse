import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_unique_projects')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  //The rpc call returns a list of objects with a project key, so we map it to a list of strings
  const projects = data.map((item: { project: string }) => item.project)

  return NextResponse.json(projects)
}
