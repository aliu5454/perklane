'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import CustomerVerification from '@/components/CustomerVerification'
import { AnalyticsTracker } from '@/lib/analytics-tracker'

/**
 * Wallet Selection Page
 * 
 * This page is shown when users scan a QR code for a pass.
 * It lets them choose between adding to Google Wallet or Apple Wallet.
 * It now also includes customer verification for the loyalty program.
 * 
 * Route: /pass/[passId]
 */

interface PassInfo {
  id: string
  title: string
  pass_type: string
  pass_url: string
  business_email: string  // Changed from business_id
  program_id: string
  pass_data: {
    title: string
    description?: string
    brandColor?: string
    logo?: string
  }
}

export default function PassSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const passId = params.passId as string
  
  const [passInfo, setPassInfo] = useState<PassInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingToWallet, setAddingToWallet] = useState<'google' | 'apple' | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [customerVerified, setCustomerVerified] = useState(false)
  const [customerPoints, setCustomerPoints] = useState<number | null>(null)
  const hasTrackedScan = useRef(false)

  useEffect(() => {
    if (passId) {
      fetchPassInfo()
    }
  }, [passId])

  // Track a scan when this page is reached (QR or shared link)
  useEffect(() => {
    if (!passInfo || hasTrackedScan.current) return
    hasTrackedScan.current = true
    AnalyticsTracker.trackView(String(passInfo.id)).catch(err => {
      console.warn('Failed to track pass view:', err)
    })
  }, [passInfo])

  const fetchPassInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/passes/${passId}`)
      
      if (!response.ok) {
        throw new Error('Pass not found')
      }
      
      const data = await response.json()
      setPassInfo(data)
    } catch (err) {
      console.error('Error fetching pass:', err)
      setError('Unable to load pass information')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToGoogleWallet = () => {
    if (!passInfo?.pass_url) return
    
    setAddingToWallet('google')
    // Optionally register that this customer added the pass (if we have a customerProgramId stored)
    if ((window as any).__customerProgramId) {
      fetch(`/api/passes/${passId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerProgramId: (window as any).__customerProgramId, wallet: 'google' })
      }).catch(err => console.warn('Register pass add failed:', err))
    }

    // Redirect to Google Wallet save URL
    // DEBUG: SetClipboard
    navigator.clipboard.writeText(passInfo.pass_url).catch(err => console.warn('Clipboard write failed:', err))
    window.location.href = passInfo.pass_url
  }

  const handleAddToAppleWallet = async () => {
    if (!passInfo?.id) return
    
    try {
      setAddingToWallet('apple')
      
      // Make API call to generate Apple Wallet pass with public access
      const response = await fetch('/api/apple-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          passId: passInfo.id,
          publicAccess: true  // Allow public access for QR code scanning
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate Apple Wallet pass')
      }

      // Get the .pkpass file as blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${passInfo.pass_data.title.replace(/[^a-z0-9]/gi, '_')}.pkpass`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Register the pass add for analytics/wallet updates if we have verified customer program id
      if ((window as any).__customerProgramId) {
        fetch(`/api/passes/${passId}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Note: For Apple Wallet, the true APNS device token is delivered by Apple
          // to the pass webServiceURL when the user adds the pass. Our web service
          // (/api/apple-pass/v1) will capture that and store it. This register call
          // is used for analytics and linking the customer program id to the pass.
          body: JSON.stringify({ customerProgramId: (window as any).__customerProgramId, wallet: 'apple' })
        }).catch(err => console.warn('Register pass add failed:', err))
      }

      setAddingToWallet(null)
    } catch (err) {
      console.error('Error adding to Apple Wallet:', err)
      setError('Failed to add to Apple Wallet')
      setAddingToWallet(null)
    }
  }
  
  // Handle customer verification success
  const handleCustomerVerified = async (customerId: string) => {
    if (!passInfo) return
    
    try {
      // Fetch customer points if we have a program ID
      if (passInfo.program_id) {
        const response = await fetch(`/api/customers/${customerId}?programId=${passInfo.program_id}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Fetched customer points data:', data);
          setCustomerPoints(data.points || 0)
          // Set pass as downloaded
          AnalyticsTracker.trackDownload(String(passInfo.id), {
            email: data.phone,
            name: data.name
          }).catch(err => {
            console.warn('Failed to track pass download:', err)
          })
          // Store the actual customer_programs.id (not customerId) for wallet registration
          if (data.customerProgramId) {
            ;(window as any).__customerProgramId = data.customerProgramId
          }
        }
      } else {
        // Fallback: if no program_id, use customerId
        ;(window as any).__customerProgramId = customerId
      }
      
      
      setCustomerVerified(true)
    } catch (err) {
      console.error('Error fetching customer points:', err)
    }
  }

  // Auto-show verification form on component mount if not verified yet
  useEffect(() => {
    if (!customerVerified && !showVerification) {
      setShowVerification(true);
    }
  }, [customerVerified, showVerification]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pass...</p>
        </div>
      </div>
    )
  }

  if (error || !passInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pass Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The pass you\'re looking for doesn\'t exist or has been removed.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }
  
  // Show customer verification form if not verified
  if (!customerVerified || showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
          {customerVerified ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Complete!</h2>
              <p className="text-gray-600 mb-4">You've successfully joined the loyalty program.</p>
              
              {customerPoints !== null && (
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <p className="text-gray-600 mb-1">Your Current Points</p>
                  <p className="text-3xl font-bold">{customerPoints}</p>
                </div>
              )}
              
              <button
                onClick={() => setShowVerification(false)}
                className="w-full px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Continue to My Pass
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Register for Loyalty Program</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Please verify your phone number to add this pass to your wallet and join the loyalty program.
              </p>
              
              {passInfo && (
                <CustomerVerification
                  programId={passInfo.program_id}
                  businessEmail={passInfo.business_email}
                  onVerified={handleCustomerVerified}
                />
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  const brandColor = passInfo.pass_data?.brandColor || '#000000'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Pass Preview Card */}
        <div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
          style={{ 
            background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}05 100%)`,
          }}
        >
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              {passInfo.pass_data.logo && (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm">
                  <Image
                    src={passInfo.pass_data.logo}
                    alt="Logo"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {passInfo.pass_data.title}
                </h1>
                {passInfo.pass_data.description && (
                  <p className="text-sm text-gray-600">
                    {passInfo.pass_data.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: brandColor }}
              />
              <span className="text-sm text-gray-600 capitalize">
                {passInfo.pass_type.replace('-', ' ')} Pass
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">
              Add to Your Wallet
            </h2>
            
            {customerPoints !== null && (
              <div className="flex items-center gap-2 bg-gray-50 py-1 px-3 rounded-full">
                <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12L8 12"></path>
                </svg>
                <span className="font-medium">{customerPoints} Points</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Choose your preferred mobile wallet to store your loyalty pass
          </p>

          <div className="space-y-3">
            
            {/* Google Wallet Button */}
            <button
              onClick={handleAddToGoogleWallet}
              disabled={addingToWallet !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl font-medium text-gray-900 hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToWallet === 'google' ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                  <span>Opening Google Wallet...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M21.8 10.5H12.3V14.1H18.3C17.8 16.7 15.4 18.3 12.3 18.3C8.7 18.3 5.7 15.3 5.7 11.7C5.7 8.1 8.7 5.1 12.3 5.1C14.1 5.1 15.7 5.8 16.9 7L19.7 4.2C17.8 2.4 15.2 1.2 12.3 1.2C6.4 1.2 1.8 5.8 1.8 11.7C1.8 17.6 6.4 22.2 12.3 22.2C17.8 22.2 22.2 18.1 22.2 12C22.2 11.5 22.1 11 21.8 10.5Z" fill="#4285F4"/>
                  </svg>
                  <span>Add to Google Wallet</span>
                </>
              )}
            </button>

            {/* Apple Wallet Button */}
            <button
              onClick={handleAddToAppleWallet}
              disabled={addingToWallet !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black text-white border-2 border-black rounded-2xl font-medium hover:bg-gray-900 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToWallet === 'apple' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating Pass...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span>Add to Apple Wallet</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Your pass will be securely added to your mobile wallet
          </p>
        </div>

        {/* Branding */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold text-gray-700">Perklane</span>
          </p>
        </div>
      </div>
    </div>
  )
}
