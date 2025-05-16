'use client';

import GoogleSignInButton from '@/components/GoogleSignInButton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

// Playful mascot SVG (calendar with a smile)
function Mascot() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="56" height="44" rx="12" fill="#6366F1"/>
      <rect x="10" y="18" width="44" height="28" rx="8" fill="#fff"/>
      <rect x="18" y="4" width="6" height="12" rx="3" fill="#6366F1"/>
      <rect x="40" y="4" width="6" height="12" rx="3" fill="#6366F1"/>
      <circle cx="22" cy="32" r="3" fill="#6366F1"/>
      <circle cx="42" cy="32" r="3" fill="#6366F1"/>
      <path d="M26 40c2 2 8 2 12 0" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      <Card className="w-full max-w-md mx-4 bg-white/70 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl animate-fade-in">
        <CardHeader className="flex flex-col items-center gap-3 pb-2">
          <div className="bg-blue-100 p-4 rounded-full mb-1 shadow-lg">
            <Mascot />
          </div>
          <span className="text-indigo-500 font-semibold text-sm">Let&apos;s check in!</span>
          <CardTitle className="text-5xl font-extrabold text-center text-gray-900 dark:text-white leading-tight">
            Weekly <span className="text-indigo-600">Pulse</span>
          </CardTitle>
          <CardDescription className="text-lg text-gray-700 dark:text-gray-300 text-center mt-2">
            Your fun, simple way to check in every week!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center w-full">
            <GoogleSignInButton className="w-64 shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-105 bg-white border border-gray-200 rounded-xl" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pt-4">
          <span className="text-sm text-muted-foreground">Please login with your @coderpush.com email.</span>
        </CardFooter>
      </Card>
    </div>
  );
} 