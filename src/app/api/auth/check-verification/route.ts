import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // First check if credentials are valid with admin client
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // If can't sign in with valid credentials due to "Email not confirmed" error
    if (authError && 
        (authError.message.includes('Email not confirmed') || 
         authError.message.includes('not verified') ||
         authError.message.includes('not confirmed'))) {
      return NextResponse.json({ isUnverified: true })
    }

    // If user exists and credentials are valid but other error occurred
    if (authData?.user && authError) {
      return NextResponse.json({ isUnverified: true })
    }

    // User doesn't exist or invalid credentials
    return NextResponse.json({ isUnverified: false })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}