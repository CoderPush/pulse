import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <NavBar user={user} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 