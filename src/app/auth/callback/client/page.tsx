'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash.substring(1);
        
        if (!hash) {
          setError('No token found in URL');
          setLoading(false);
          router.push('/auth/login');
          return;
        }

        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken) {
          setError('No access token found');
          setLoading(false);
          router.push('/auth/login');
          return;
        }

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

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        await fetch('/api/auth/set-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
          }),
        });

        if (sessionError) {
          setError('Failed to set session: ' + sessionError.message);
          setLoading(false);
          router.push('/auth/login');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError || !session) {
          setError('Failed to verify session');
          setLoading(false);
          router.push('/auth/login');
          return;
        }

        const { data: { user }, error: getUserError } = await supabase.auth.getUser();
        
        if (getUserError || !user) {
          setError('Failed to get user data');
          setLoading(false);
          router.push('/auth/login');
          return;
        }
        
        window.location.hash = '';
        window.location.href = '/';
      } catch {
        setError('An unexpected error occurred');
        setLoading(false);
        router.push('/auth/login');
      }
    };

    handleCallback();
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

  return null;
} 