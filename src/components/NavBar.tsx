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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from '@/utils/actions'
import { User } from '@supabase/supabase-js'
import { getInitials } from '@/lib/auth/user'
import { 
  UserCircle, 
  History, 
  LogOut, 
  LineChart,
  Trophy,
  Share,
  HeartPulse,
  CalendarDays,
  Settings
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
              className="flex items-center space-x-2 text-xl font-semibold group transition-transform duration-200 hover:scale-105"
            >
              <LineChart className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:rotate-6 transition-transform duration-200" />
              <span className="text-blue-600 dark:text-blue-400">Weekly Pulse</span>
            </Link>
          </div>

          {/* Weekly/Daily Pulse Segmented Control */}
          <div className="flex items-center space-x-2 bg-white/60 dark:bg-gray-900/60 rounded-full px-2 py-1 shadow-inner border border-gray-200 dark:border-gray-800">
            <Link
              href="/history"
              className="relative px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-pink-300
                bg-gradient-to-r from-pink-500 to-pink-700 text-white shadow-md
                hover:from-pink-600 hover:to-pink-800
                ring-2 ring-pink-200 hover:ring-4 hover:scale-105
                "
              style={{ fontSize: '1.05rem', letterSpacing: '0.01em' }}
            >
              <HeartPulse className="h-5 w-5 group-hover:animate-pulse" />
              <span>My Weekly Pulse</span>
            </Link>
            <Link
              href="/daily-pulse"
              className="relative px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-green-300
                bg-gradient-to-r from-green-500 to-green-700 text-white shadow-md
                hover:from-green-600 hover:to-green-800
                ring-2 ring-green-200 hover:ring-4 hover:scale-105
                "
              style={{ fontSize: '1.05rem', letterSpacing: '0.01em' }}
            >
              <CalendarDays className="h-5 w-5 group-hover:animate-bounce" />
              <span>My Daily Pulse</span>
            </Link>
          </div>

          {/* User Dropdown */}
          <div className="flex items-center space-x-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-11 w-11 rounded-full bg-white/70 hover:bg-white/90 dark:bg-gray-900/80 dark:hover:bg-gray-800 transition-colors shadow-lg border border-white/30"
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
                <DropdownMenuGroup>
                  <Link href="/profile" className="w-full">
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:scale-95">
                      <UserCircle className="h-5 w-5 text-indigo-500" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings" className="w-full">
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-green-50 dark:hover:bg-green-900/30 active:scale-95">
                      <Settings className="h-5 w-5 text-green-500" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/history" className="w-full">
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-pink-50 dark:hover:bg-pink-900/30 active:scale-95">
                      <HeartPulse className="h-5 w-5 text-pink-500" />
                      <span>My Weekly Pulse</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/daily-pulse" className="w-full">
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-green-50 dark:hover:bg-green-900/30 active:scale-95">
                      <CalendarDays className="h-5 w-5 text-green-500" />
                      <span>My Daily Pulse</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/leaderboard" className="w-full">
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-yellow-50 dark:hover:bg-yellow-900/30 active:scale-95">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span>Leaderboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/submissions/shared-with-me" className="w-full">
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95">
                      <Share className="w-5 h-5" />
                      <span>Shared with Me</span>
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-red-50 dark:focus:bg-red-950 px-4 py-2 rounded-lg transition-all hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95">
                  <form action={signOut} className="w-full">
                    <button type="submit" className="w-full text-left text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold">
                      <LogOut className="h-5 w-5" />
                      <span>Sign out</span>
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