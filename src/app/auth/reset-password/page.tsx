"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tokenPresent, setTokenPresent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Parse hash params for Supabase tokens (access_token, refresh_token)
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    if (!hash) return

    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      setTokenPresent(true)
      ;(async () => {
        const supabase = createClient()
        try {
          // set session so updateUser can run
          await supabase.auth.setSession({ access_token, refresh_token })
          // optionally clear the hash so tokens aren't visible
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
        } catch (err) {
          console.error('Error setting session from hash:', err)
          setError('Failed to initialize password reset session. Please try again or request a new link.')
        }
      })()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!password || password.length < 8) {
      setError('Please provide a password with at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        console.error('Update password error:', updateError)
        setError(updateError.message || 'Failed to update password')
      } else {
        setMessage('Password updated successfully. Redirecting to sign in...')
        setTimeout(() => router.push('/auth/signin'), 1500)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/40 rounded-[20px] p-8 shadow-sm">
          <h1 className="text-2xl font-medium mb-4">Reset your password</h1>
          {!tokenPresent && (
            <p className="text-sm text-foreground">We couldn't find a reset token in the URL. Please use the link in the email you received, or request a new one from the sign-in page.</p>
          )}

          {tokenPresent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded">{message}</div>}
              {error && <div className="text-sm text-rose-700 bg-rose-50 px-3 py-2 rounded">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[10px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[10px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button disabled={loading} className="w-full h-[44px] bg-black text-white font-medium rounded-[10px]">
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
