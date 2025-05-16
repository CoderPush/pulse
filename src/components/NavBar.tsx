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
  LineChart
} from 'lucide-react'

interface NavBarProps {
  user: User;
}

export default function NavBar({ user }: NavBarProps) {
  const userInitials = getInitials(user.email);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-950 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-xl font-semibold hover:opacity-90 transition-opacity group"
            >
              <LineChart className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-blue-600 dark:text-blue-400">Weekly Pulse</span>
            </Link>
          </div>

          {/* User Dropdown */}
          <div className="flex items-center space-x-4">
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
              <DropdownMenuContent className="w-72 rounded-2xl shadow-2xl bg-white/90 dark:bg-gray-900/90 border border-white/30 animate-fade-in" align="end" forceMount>
                {/* User Card */}
                <DropdownMenuLabel className="font-normal px-4 py-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-tr from-indigo-400 via-blue-400 to-purple-400 text-white text-xl font-extrabold flex items-center justify-center">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{user.email}</p>
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
                  <Link href="/history" className="w-full">
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:scale-95">
                      <History className="h-5 w-5 text-blue-500" />
                      <span>History</span>
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-red-50 dark:focus:bg-red-950 px-4 py-2 rounded-lg transition-all hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95">
                  <form action={signOut} className="w-full">
                    <button type="submit" className="w-full text-left text-red-600 dark:text-red-400 flex items-center gap-2">
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