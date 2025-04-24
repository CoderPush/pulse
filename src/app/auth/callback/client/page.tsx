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
        console.log('Starting callback handling...');
        
        // Get the hash part of the URL
        const hash = window.location.hash.substring(1);
        console.log('Hash:', hash);
        
        if (!hash) {
          console.log('No hash found');
          setError('No token found in URL');
          setLoading(false);
          return;
        }

        // Parse the hash parameters
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        console.log('Access token found:', !!accessToken);

        if (!accessToken) {
          console.log('No access token found');
          setError('No access token found');
          setLoading(false);
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

        console.log('Setting session...');
        // Set the session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to set session: ' + sessionError.message);
          setLoading(false);
          return;
        }

        // Wait for session to be properly set
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify the session and get user data
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        console.log('Session data:', session);
        
        if (getSessionError || !session) {
          console.error('Session verification failed:', getSessionError);
          setError('Failed to verify session');
          setLoading(false);
          return;
        }

        // Get user data
        const { data: { user }, error: getUserError } = await supabase.auth.getUser();
        console.log('User data:', user);
        
        if (getUserError || !user) {
          console.error('User verification failed:', getUserError);
          setError('Failed to get user data');
          setLoading(false);
          return;
        }

        console.log('Session and user verified, redirecting...');
        
        // Clear the hash from URL
        window.location.hash = '';
        
        // Force a hard refresh to ensure the server gets the new session
        window.location.href = '/';
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Setting up your session...</h1>
          <p>Please wait while we log you in.</p>
        </div>
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
            onClick={() => window.location.href = '/auth/login'}
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