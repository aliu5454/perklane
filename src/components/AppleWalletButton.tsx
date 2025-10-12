'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { AnalyticsTracker } from '@/lib/analytics-tracker'

interface AppleWalletButtonProps {
  passId: string | number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  onError?: (error: string) => void
  onSuccess?: () => void
}

export default function AppleWalletButton({
  passId,
  size = 'md',
  variant = 'primary',
  className = '',
  onError,
  onSuccess
}: AppleWalletButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleAddToWallet = async () => {
    if (!passId) {
      const errorMsg = 'Pass ID not available'
      console.error(errorMsg)
      onError?.(errorMsg)
      return
    }
    
    setIsLoading(true)
    
    try {
      // Track the add to wallet event
      await AnalyticsTracker.trackAddToWallet(passId.toString())
      
      // Generate and download the .pkpass file
      const response = await fetch('/api/apple-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ passId })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate Apple Wallet pass')
      }
      
      // Get the .pkpass file as a blob
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pass-${passId}.pkpass`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      onSuccess?.()
      
    } catch (error: any) {
      console.error('Error adding to Apple Wallet:', error)
      onError?.(error.message || 'Failed to add to Apple Wallet')
    } finally {
      setIsLoading(false)
    }
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
      disabled={!passId || isLoading}
      className={`
        inline-flex items-center rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      title={passId ? "Add to Apple Wallet" : "Apple Wallet not available"}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Wallet className={`
            ${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}
          `} />
          Add to Apple Wallet
        </>
      )}
    </button>
  )
}

// Alternative minimal version for compact spaces
export function AppleWalletButtonMini({
  passId,
  className = '',
  onError,
  onSuccess
}: {
  passId: string | number
  className?: string
  onError?: (error: string) => void
  onSuccess?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleAddToWallet = async () => {
    if (!passId) {
      const errorMsg = 'Pass ID not available'
      console.error(errorMsg)
      onError?.(errorMsg)
      return
    }
    
    setIsLoading(true)
    
    try {
      await AnalyticsTracker.trackAddToWallet(passId.toString())
      
      const response = await fetch('/api/apple-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ passId })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate Apple Wallet pass')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pass-${passId}.pkpass`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      onSuccess?.()
      
    } catch (error: any) {
      console.error('Error adding to Apple Wallet:', error)
      onError?.(error.message || 'Failed to add to Apple Wallet')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleAddToWallet}
      disabled={!passId || isLoading}
      className={`
        inline-flex items-center justify-center
        w-8 h-8 rounded-lg
        bg-black text-white hover:bg-gray-800
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        ${className}
      `}
      title="Add to Apple Wallet"
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Wallet className="w-4 h-4" />
      )}
    </button>
  )
}
