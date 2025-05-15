import Link from 'next/link'
import { User, History, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SidebarItem = {
  title: string
  href: string
  icon: React.ReactNode
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Profile',
    href: '/profile',
    icon: <User className="w-5 h-5" />
  },
  {
    title: 'History',
    href: '/history',
    icon: <History className="w-5 h-5" />
  },
  {
    title: 'Leaderboard',
    href: '/leaderboard',
    icon: <Trophy className="w-5 h-5 text-yellow-500" />
  }
]

export function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1">
      {sidebarItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
            "hover:bg-gray-100 dark:hover:bg-gray-700",
            "group",
            pathname.startsWith(item.href) &&
              "bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-300"
          )}
        >
          {item.icon}
          <span>{item.title}</span>
        </Link>
      ))}
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