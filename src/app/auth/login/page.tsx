'use client';

import GoogleSignInButton from '@/components/GoogleSignInButton';
import { CalendarCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-blue-100 p-4 rounded-full">
                <CalendarCheck className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Weekly Pulse</h1>
              <p className="text-gray-600">Track your weekly pulse</p>
            </div>
          </div>

          {/* Sign In Section */}
          <div className="space-y-6">
            <GoogleSignInButton />
          </div>

        </div>
      </div>
    </div>
  );
} 