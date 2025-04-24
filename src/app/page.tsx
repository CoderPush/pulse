'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import WeeklyPulseForm from '@/components/WeeklyPulseForm';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log('Starting auth check...');
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          }
        );

        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Session check result:', { session: !!session, error: sessionError });

        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setError('Session error: ' + sessionError.message);
            setLoading(false);
          }
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to login');
          if (mounted) {
            router.push('/auth/login');
          }
          return;
        }

        // Then check if we have a user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('User check result:', { user: !!user, error: userError });

        if (userError) {
          console.error('User error:', userError);
          if (mounted) {
            setError('User error: ' + userError.message);
            setLoading(false);
          }
          return;
        }

        if (!user) {
          console.log('No user found, redirecting to login');
          if (mounted) {
            router.push('/auth/login');
          }
          return;
        }

        console.log('Auth check successful, user:', user.email);
        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in auth check:', err);
        if (mounted) {
          setError('An unexpected error occurred');
          setLoading(false);
        }
      }
    };

    // Add a small delay before checking auth
    const timer = setTimeout(() => {
      checkAuth();
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <WeeklyPulseForm />
    </main>
  );
}
