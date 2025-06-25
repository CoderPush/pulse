import React from 'react'
import Link from 'next/link'
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from '@/utils/actions'
import { User } from '@supabase/supabase-js'
import { getInitials } from '@/lib/auth/user'
import { 
  LogOut, 
  LineChart,
  Trophy,
  Share,
  HeartPulse,
  CalendarDays
} from 'lucide-react'

interface NavBarProps {
  user: User;
}

export default function NavBar({ user }: NavBarProps) {
  const userInitials = getInitials(user.email);
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-gray-950/80 shadow-lg border-b border-transparent" style={{boxShadow: '0 4px 24px 0 rgba(80,80,180,0.07)'}}>
      {/* Gradient accent border */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-pink-400 to-green-400 opacity-60" />
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-xl font-semibold hover:opacity-90 transition-opacity group"
            >
              <LineChart className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-blue-600 dark:text-blue-400 hidden md:block">Weekly Pulse</span>
            </Link>
          </div>

          {/* Right side: My Pulse Dropdown and User Dropdown */}
          <div className="flex items-center space-x-6">
            {/* My Pulse Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="relative px-6 py-2 rounded-full font-bold flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-700 text-white shadow-md hover:from-pink-600 hover:to-pink-800 ring-2 ring-pink-200 hover:ring-4 hover:scale-105 transition-all"
                  style={{ fontSize: '1.05rem', letterSpacing: '0.01em' }}
                >
                  <HeartPulse className="h-5 w-5" />
                  <span>My Pulse</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white shadow-xl rounded-xl p-2 min-w-[180px] animate-fade-in">
                <DropdownMenuItem asChild>
                  <Link
                    href="/history"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-pink-700 hover:bg-pink-50 transition-all duration-150 group"
                  >
                    <HeartPulse className="h-4 w-4 text-pink-500 group-hover:animate-pulse" />
                    My Weekly Pulse
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/daily-pulse"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-green-700 hover:bg-green-50 transition-all duration-150 group"
                  >
                    <CalendarDays className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                    My Daily Pulse
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-11 w-11 rounded-full bg-white/70 hover:bg-white/90 dark:bg-gray-900/80 dark:hover:bg-gray-800 transition-colors shadow-lg border border-white/30 cursor-pointer"
                >
                  <span className="absolute bottom-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white dark:ring-gray-950 animate-pulse" />
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-tr from-indigo-400 via-blue-400 to-purple-400 text-white text-lg font-bold flex items-center justify-center">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 rounded-2xl shadow-2xl bg-gradient-to-br from-white/90 via-blue-50/80 to-purple-50/80 dark:from-gray-900/90 dark:via-gray-800/90 dark:to-gray-900/80 border border-white/30 animate-fade-in backdrop-blur-md" align="end" forceMount>
                {/* User Card */}
                <DropdownMenuLabel className="font-normal px-4 py-5 bg-gradient-to-r from-blue-100/60 via-pink-100/60 to-green-100/60 dark:from-gray-800/80 dark:via-gray-900/80 dark:to-gray-800/80 rounded-t-2xl mb-2">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-gradient-to-tr from-indigo-400 via-blue-400 to-purple-400 text-white text-2xl font-extrabold flex items-center justify-center">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.email}</p>
                      <p>
                        <Link href="/profile" className="text-xs text-indigo-500 font-semibold mt-1 hover:underline hover:text-indigo-700 transition-colors">
                          View profile
                        </Link>
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Other */}
                <DropdownMenuItem asChild>
                  <Link href="/leaderboard" className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Leaderboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/submissions/shared-with-me" className="flex items-center gap-2">
                    <Share className="w-5 h-5" />
                    Shared with Me
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Sign out */}
                <DropdownMenuItem asChild>
                  <form action={signOut} className="w-full">
                    <button type="submit" className="w-full text-left text-red-600 flex items-center gap-2 font-semibold">
                      <LogOut className="h-5 w-5" />
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </header>
  );
} 