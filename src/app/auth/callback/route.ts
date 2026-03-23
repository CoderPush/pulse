import { NextRequest, NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient} from '@/utils/supabase/server'
import { getCompanyDomain } from '@/utils/companyDomain'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL; otherwise go to check-ins
  const next = searchParams.get('next') ?? '/check-ins'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error)
      // Log the error but still redirect to error page
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
    }
    
    // Fetch the user
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email

    // Check if the email is from your company domain
    const companyDomain = getCompanyDomain()
    if (!email || !email.endsWith(companyDomain)) {
      // Sign out the user
      await supabase.auth.signOut()
      // Redirect to an error page or login with a message
      return NextResponse.redirect(`${origin}/auth/invalid-domain`)
    }

    const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
    const isLocalEnv = process.env.NODE_ENV === 'development'
    if (isLocalEnv) {
      // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}