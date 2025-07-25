import Link from 'next/link'
import { User, Trophy, Share, HeartPulse, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SidebarItem = {
  title: string
  href: string
  icon: React.ReactNode
}

const mainSidebarItems: SidebarItem[] = [
  {
    title: 'My Weekly Pulse',
    href: '/history',
    icon: <HeartPulse className="w-5 h-5 text-pink-500" />
  },
  {
    title: 'My Daily Tasks',
    href: '/daily-tasks',
    icon: <CalendarDays className="w-5 h-5 text-green-500" />
  }
]

const optionalSidebarItems: SidebarItem[] = [
  {
    title: 'Profile',
    href: '/profile',
    icon: <User className="w-5 h-5" />
  },
  {
    title: 'Leaderboard',
    href: '/leaderboard',
    icon: <Trophy className="w-5 h-5 text-yellow-500" />
  },
  {
    title: 'Shared with Me',
    href: '/submissions/shared-with-me',
    icon: <Share className="w-5 h-5" />
  }
]

export function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1">
      {/* Main tabs */}
      <div className="mb-4 flex flex-col gap-1">
        {mainSidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all",
              "hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-50",
              "variant-ghost",
              pathname.startsWith(item.href) &&
                "bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-300"
            )}
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
      {/* Optional section */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1">
        {optionalSidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              pathname.startsWith(item.href) &&
                "bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-300"
            )}
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function Sidebar({ pathname }: { pathname: string }) {
  return (
    <div className="hidden md:block w-64 border-r bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <SidebarContent pathname={pathname} />
      </div>
    </div>
  )
} 