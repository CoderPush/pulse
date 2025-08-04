import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Try to get name from various sources
  let name = null;
  
  // 1. Check if name exists in users table
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single();
  
  if (userData?.name) {
    name = userData.name;
  } else {
    // 2. Fall back to Google OAuth metadata
    const googleName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.identities?.[0]?.identity_data?.full_name ||
                      user.identities?.[0]?.identity_data?.name;
    
    if (googleName) {
      name = googleName;
    }
  }

  return NextResponse.json({ 
    user: {
      ...user,
      name: name
    }
  });
} 