import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = body?.email

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Optional redirect after reset — adjust if you have a reset page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.perklane.io'
    const redirectTo = `${appUrl.replace(/\/$/, '')}/auth/reset-password`
    console.log('Redirect URL for password reset:', redirectTo)

    // Use Supabase auth to send a password reset email
    // Note: resetPasswordForEmail is available in the Supabase JS client
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      console.error('Supabase reset error:', error)
      return NextResponse.json({ error: error.message || 'Failed to send reset email' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Password reset email sent' })
  } catch (err: any) {
    console.error('Forgot-password error:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
