'use client'

import { Wallet } from 'lucide-react'
import { AnalyticsTracker } from '@/lib/analytics-tracker'

interface GoogleWalletButtonProps {
  passUrl: string
  passId?: string | number  // Add passId for tracking
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  onError?: (error: string) => void
}

export default function GoogleWalletButton({
  passUrl,
  passId,
  size = 'md',
  variant = 'primary',
  className = '',
  onError
}: GoogleWalletButtonProps) {
  
  const handleAddToWallet = async () => {
    if (!passUrl) {
      const errorMsg = 'Google Wallet link not available'
      console.error(errorMsg)
      onError?.(errorMsg)
      return
    }
    
    // Track the add to wallet event
    if (passId) {
      try {
        await AnalyticsTracker.trackAddToWallet(passId.toString())
      } catch (error) {
        console.warn('Failed to track add to wallet event:', error)
      }
    }
    
    // Open the Google Wallet save URL in a new tab
    window.open(passUrl, '_blank', 'noopener,noreferrer')
  }

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-2',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-3'
  }

  // Variant styles
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border border-black text-black hover:bg-black hover:text-white'
  }

  return (
    <button
      onClick={handleAddToWallet}
      disabled={!passUrl}
      className={`
        inline-flex items-center rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      title={passUrl ? "Add to Google Wallet" : "Google Wallet link not available"}
    >
      <Wallet className={`
        ${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}
      `} />
      Add to Google Wallet
    </button>
  )
}

// Alternative minimal version for compact spaces
export function GoogleWalletButtonMini({
  passUrl,
  passId,
  className = '',
  onError
}: {
  passUrl: string
  passId?: string | number  // Add passId for tracking
  className?: string
  onError?: (error: string) => void
}) {
  const handleAddToWallet = async () => {
    if (!passUrl) {
      const errorMsg = 'Google Wallet link not available'
      console.error(errorMsg)
      onError?.(errorMsg)
      return
    }
    
    // Track the add to wallet event
    if (passId) {
      try {
        await AnalyticsTracker.trackAddToWallet(passId.toString())
      } catch (error) {
        console.warn('Failed to track add to wallet event:', error)
      }
    }
    
    window.open(passUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleAddToWallet}
      disabled={!passUrl}
      className={`
        inline-flex items-center justify-center w-8 h-8 rounded-full
        bg-black text-white hover:bg-gray-800 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={passUrl ? "Add to Google Wallet" : "Google Wallet link not available"}
    >
      <Wallet className="w-4 h-4" />
    </button>
  )
}