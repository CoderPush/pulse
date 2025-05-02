'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Bell,
  Calendar,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Pulses',
    href: '/admin/pulses',
    icon: FileText,
  },
  {
    title: 'Submissions',
    href: '/admin/submissions',
    icon: FileText,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Reminders',
    href: '/admin/reminders',
    icon: Bell,
  },
  {
    title: 'Calendar',
    href: '/admin/calendar',
    icon: Calendar,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={cn(
          'flex flex-col border-r bg-background',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <h1 className={cn('font-semibold', isCollapsed && 'hidden')}>
            Admin Dashboard
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                'h-4 w-4 transition-transform',
                isCollapsed ? 'rotate-180' : ''
              )}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="container mx-auto p-6">{children}</main>
      </div>
    </div>
  );
} 