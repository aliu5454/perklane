'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react'
import GoogleWalletButton from './GoogleWalletButton'
import AppleWalletButton from './AppleWalletButton'
import { AnalyticsTracker } from '@/lib/analytics-tracker'

interface CreatePassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void // Callback for when pass is successfully created/updated
  editPass?: {
    id: number
    title: string
    pass_type: string
    pass_data: any
  } | null
}

type PassType = 'generic' | 'gift-card' | 'loyalty' | 'offer' | 'smart-tap'

interface PassTypeOption {
  id: PassType
  name: string
  description: string
  icon: string
}

const passTypes: PassTypeOption[] = [
  {
    id: 'generic',
    name: 'Generic Pass',
    description: 'A basic pass for general use cases',
    icon: '📄'
  },
  {
    id: 'gift-card',
    name: 'Gift Card',
    description: 'Digital gift cards with monetary value',
    icon: '🎁'
  },
  {
    id: 'loyalty',
    name: 'Loyalty Pass',
    description: 'Reward frequent customers with points or stamps',
    icon: '⭐'
  },
  {
    id: 'offer',
    name: 'Offer Pass',
    description: 'Special discounts and promotional offers',
    icon: '🏷️'
  },
  {
    id: 'smart-tap',
    name: 'Smart Tap',
    description: 'NFC-enabled passes for quick interactions',
    icon: '📱'
  }
]

// Pass Card Preview Component
interface PassCardPreviewProps {
  passType: PassType | null
  formData: Record<string, any>
  imagePreview: string | null
}

function PassCardPreview({ passType, formData, imagePreview }: PassCardPreviewProps) {
  if (!passType) {
    return (
      <div className="w-full h-[200px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border border-gray-200">
        <div className="text-center text-gray-400">
          <div className="text-3xl mb-2">📱</div>
          <p className="text-sm">Select a pass type to see preview</p>
        </div>
      </div>
    )
  }

  const brandColor = formData.brandColor || '#000000'
  const title = formData.title || 'Your Pass Title'
  const passTypeData = passTypes.find(p => p.id === passType)
  
  return (
    <div className="relative">
      {/* Card Container */}
      <div 
        className="w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300"
        style={{ 
          background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}05 100%)`,
          minHeight: '200px'
        }}
      >
        {/* Top Section with Logo and Title */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Logo" 
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  {passTypeData?.icon || '📱'}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 text-base leading-tight">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {passTypeData?.name || 'Pass'}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              {passType.replace('-', ' ')}
            </div>
          </div>

          {/* Pass Type Specific Content */}
          {renderPassSpecificPreview(passType, formData, brandColor)}
        </div>

        {/* Bottom Border with Brand Color */}
        <div 
          className="h-2"
          style={{ backgroundColor: brandColor }}
        />
      </div>

      {/* Mobile Wallet Style Notch */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
        <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  )
}

function renderPassSpecificPreview(passType: PassType, formData: Record<string, any>, brandColor: string) {
  switch (passType) {
    case 'gift-card':
      return (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Balance</span>
            <span className="text-lg font-bold text-gray-900">
              ${formData.balance || '0.00'}
            </span>
          </div>
          {formData.cardNumber && (
            <div className="text-xs text-gray-500 font-mono">
              •••• •••• •••• {formData.cardNumber.slice(-4) || '0000'}
            </div>
          )}
          {formData.expirationDate && (
            <div className="text-xs text-gray-500">
              Expires: {new Date(formData.expirationDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )

    case 'loyalty':
      return (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Points</span>
            <span className="text-lg font-bold text-gray-900">
              {formData.pointsBalance || '0'}
            </span>
          </div>
          {formData.memberName && (
            <div className="text-sm text-gray-700">
              {formData.memberName}
            </div>
          )}
          {formData.tier && (
            <div className="flex items-center gap-2">
              <div 
                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: brandColor }}
              >
                {formData.tier.toUpperCase()}
              </div>
            </div>
          )}
        </div>
      )

    case 'offer':
      return (
        <div className="space-y-3">
          {formData.offerCode && (
            <div className="text-center">
              <div 
                className="inline-block px-4 py-2 rounded-lg text-white font-bold text-lg tracking-wider"
                style={{ backgroundColor: brandColor }}
              >
                {formData.offerCode}
              </div>
            </div>
          )}
          {formData.expiryDate && (
            <div className="text-xs text-gray-500 text-center">
              Valid until {new Date(formData.expiryDate).toLocaleDateString()}
            </div>
          )}
          {formData.redemptionInstructions && (
            <div className="text-xs text-gray-600 text-center line-clamp-2">
              {formData.redemptionInstructions}
            </div>
          )}
        </div>
      )

    case 'smart-tap':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl border-4 border-white shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              📱
            </div>
          </div>
          {formData.merchantId && (
            <div className="text-xs text-gray-500 text-center">
              Merchant ID: {formData.merchantId}
            </div>
          )}
          <div className="text-xs text-gray-600 text-center">
            Tap to use
          </div>
        </div>
      )

    case 'generic':
    default:
      return (
        <div className="space-y-3">
          {formData.description && (
            <div className="text-sm text-gray-600 line-clamp-3">
              {formData.description}
            </div>
          )}
          {formData.expirationDate && (
            <div className="text-xs text-gray-500">
              Expires: {new Date(formData.expirationDate).toLocaleDateString()}
            </div>
          )}
          <div className="flex items-center justify-center">
            <div className="text-2xl">
              {passTypes.find(p => p.id === passType)?.icon || '📄'}
            </div>
          </div>
        </div>
      )
  }
}

// Toast Component
interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div className={`fixed top-4 right-4 z-[60] max-w-md rounded-lg shadow-lg border p-4 animate-in slide-in-from-top-2 duration-300 ${
      type === 'success' 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-start gap-3">
        {type === 'success' ? (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function CreatePassModal({ isOpen, onClose, onSuccess, editPass }: CreatePassModalProps) {
  const [selectedType, setSelectedType] = useState<PassType | null>(null)
  const [step, setStep] = useState<'select' | 'form'>('select')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [showAdditionalSettings, setShowAdditionalSettings] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{ qrCodeUrl?: string; passUrl?: string; passId?: string | number } | null>(null)
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      if (editPass) {
        // Populate form with edit data
        setSelectedType(editPass.pass_type as PassType)
        setStep('form')
        setFormData(editPass.pass_data || {})
        // Set image preview if logo exists in pass_data
        if (editPass.pass_data?.logo) {
          setImagePreview(editPass.pass_data.logo)
        }
      } else {
        // Reset for new pass
        setSelectedType(null)
        setStep('select')
        setFormData({})
        setImagePreview(null)
      }
      
      setShowAdditionalSettings(false)
      setUploadingImage(false)
      setIsSubmitting(false)
      setSuccessData(null)
      setShowToast(null)
    }
  }, [isOpen, editPass])

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleNext = () => {
    if (selectedType) {
      setStep('form')
    }
  }

  const handleBack = () => {
    setStep('select')
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)

    try {
      // Create preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Create FormData for upload
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)

      // Upload to your backend API
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      if (data.success && data.url) {
        // Update form data with the returned URL
        handleFormChange('logo', data.url)
      } else {
        throw new Error('Invalid response from server')
      }
      
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    // Validate required fields
    const requiredFields: Record<PassType, string[]> = {
      'gift-card': ['title', 'cardNumber', 'balance'],
      'loyalty': ['title', 'memberName', 'pointsBalance', 'tier'],
      'offer': ['title', 'offerCode', 'expiryDate', 'redemptionInstructions'],
      'smart-tap': ['title', 'merchantId', 'deviceBindingId'],
      'generic': ['title']
    }

    if (selectedType) {
      const required = requiredFields[selectedType] || []
      const missing = required.filter(field => !formData[field]?.toString().trim())
      
      if (missing.length > 0) {
        setShowToast({
          message: `Please fill in required fields: ${missing.join(', ')}`,
          type: 'error'
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Filter out empty values from formData
      const cleanFormData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, any>)

      if (editPass) {
        // Update existing pass
        const response = await fetch(`/api/passes/${editPass.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: cleanFormData.title,
            pass_data: cleanFormData
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}: Failed to update pass`)
        }

        if (result.success) {
          setShowToast({
            message: 'Pass updated successfully!',
            type: 'success'
          })
          
          // Trigger immediate refresh of passes list
          if (onSuccess) {
            onSuccess()
          }
          
          // Auto-close modal after 2 seconds
          setTimeout(() => {
            onClose()
          }, 2000)
        } else {
          throw new Error(result.error || 'Failed to update pass')
        }
      } else {
        // Create new pass
        const passData = {
          passType: selectedType,
          passData: cleanFormData,
          metadata: {
            createdAt: new Date().toISOString(),
            version: '1.0'
          }
        }

        const response = await fetch('/api/google-wallet/create-class-object', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(passData),
        })

        let result
        try {
          result = await response.json()
        } catch (parseError) {
          const rawResponse = await response.text()
          console.error('Raw response:', rawResponse)
          throw new Error(`Server returned non-JSON response (${response.status}): ${rawResponse.substring(0, 200)}...`)
        }

        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}: Failed to create pass`)
        }

        if (result.success) {
          setSuccessData({
            qrCodeUrl: result.qrCodeUrl,
            passUrl: result.passUrl,
            passId: result.passId
          })
          setShowToast({
            message: 'Pass created successfully! QR code is ready for download.',
            type: 'success'
          })
          
          // Track pass creation analytics if we have a pass ID
          if (result.passId) {
            try {
              await AnalyticsTracker.trackEvent({
                passId: result.passId.toString(),
                eventType: 'view', // Track initial creation as a view event
                metadata: {
                  created_via: 'modal',
                  pass_type: selectedType
                }
              })
            } catch (error) {
              console.warn('Failed to track pass creation:', error)
            }
          }
          
          // Trigger immediate refresh of passes list
          if (onSuccess) {
            onSuccess()
          }
          
          // Auto-close modal after 3 seconds if successful
          setTimeout(() => {
            onClose()
          }, 3000)
        } else {
          throw new Error(result.error || 'Failed to create pass')
        }
      }
      
    } catch (error) {
      console.error('Pass operation error:', error)
      setShowToast({
        message: `Failed to ${editPass ? 'update' : 'create'} pass: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderAdditionalSettingsFields = () => {
    if (!selectedType) return null

    switch (selectedType) {
      case 'generic':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expirationDate || ''}
                  onChange={(e) => handleFormChange('expirationDate', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Barcode Format
                </label>
                <select
                  value={formData.barcodeFormat || ''}
                  onChange={(e) => handleFormChange('barcodeFormat', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">No Barcode</option>
                  <option value="QR_CODE">QR Code</option>
                  <option value="CODE_128">Code 128</option>
                  <option value="CODE_39">Code 39</option>
                  <option value="EAN_13">EAN 13</option>
                  <option value="UPC_A">UPC A</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.termsConditions || ''}
                onChange={(e) => handleFormChange('termsConditions', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Enter terms and conditions"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={formData.supportEmail || ''}
                  onChange={(e) => handleFormChange('supportEmail', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="support@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl || ''}
                  onChange={(e) => handleFormChange('websiteUrl', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="https://company.com"
                />
              </div>
            </div>
          </div>
        )

      case 'gift-card':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Barcode Format
                </label>
                <select
                  value={formData.barcodeFormat || ''}
                  onChange={(e) => handleFormChange('barcodeFormat', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">No Barcode</option>
                  <option value="QR_CODE">QR Code</option>
                  <option value="CODE_128">Code 128</option>
                  <option value="CODE_39">Code 39</option>
                  <option value="EAN_13">EAN 13</option>
                  <option value="UPC_A">UPC A</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Support Phone
                </label>
                <input
                  type="tel"
                  value={formData.supportPhone || ''}
                  onChange={(e) => handleFormChange('supportPhone', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expirationDate || ''}
                  onChange={(e) => handleFormChange('expirationDate', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={formData.currencyCode || ''}
                  onChange={(e) => handleFormChange('currencyCode', e.target.value.toUpperCase())}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="USD"
                  maxLength={3}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.termsConditions || ''}
                onChange={(e) => handleFormChange('termsConditions', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Gift card terms and conditions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Purchase Location
              </label>
              <input
                type="text"
                value={formData.purchaseLocation || ''}
                onChange={(e) => handleFormChange('purchaseLocation', e.target.value)}
                className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Store location or website"
              />
            </div>
          </div>
        )

      case 'loyalty':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expirationDate || ''}
                  onChange={(e) => handleFormChange('expirationDate', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Account ID
                </label>
                <input
                  type="text"
                  value={formData.accountId || ''}
                  onChange={(e) => handleFormChange('accountId', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Member account ID"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Secondary Points Type
                </label>
                <input
                  type="text"
                  value={formData.secondaryPointsType || ''}
                  onChange={(e) => handleFormChange('secondaryPointsType', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Miles, Stamps, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Secondary Points Balance
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.secondaryPointsBalance || ''}
                  onChange={(e) => handleFormChange('secondaryPointsBalance', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.termsConditions || ''}
                onChange={(e) => handleFormChange('termsConditions', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Loyalty program terms and conditions"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Program Website
                </label>
                <input
                  type="url"
                  value={formData.programWebsite || ''}
                  onChange={(e) => handleFormChange('programWebsite', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="https://loyalty.company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Customer Service Phone
                </label>
                <input
                  type="tel"
                  value={formData.customerServicePhone || ''}
                  onChange={(e) => handleFormChange('customerServicePhone', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        )

      case 'offer':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Max Redemptions
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxRedemptions || ''}
                  onChange={(e) => handleFormChange('maxRedemptions', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Unlimited if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.discountType || ''}
                  onChange={(e) => handleFormChange('discountType', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select discount type</option>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="buy_one_get_one">Buy One Get One</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountValue || ''}
                  onChange={(e) => handleFormChange('discountValue', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="10 (for 10% or $10)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Minimum Purchase Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimumPurchase || ''}
                  onChange={(e) => handleFormChange('minimumPurchase', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="No minimum if empty"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Location Restrictions
              </label>
              <textarea
                value={formData.locationRestrictions || ''}
                onChange={(e) => handleFormChange('locationRestrictions', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Valid at all locations or specify restrictions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Fine Print
              </label>
              <textarea
                value={formData.finePrint || ''}
                onChange={(e) => handleFormChange('finePrint', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Additional terms, exclusions, and fine print"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Provider Website
                </label>
                <input
                  type="url"
                  value={formData.providerWebsite || ''}
                  onChange={(e) => handleFormChange('providerWebsite', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="https://company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Barcode Format
                </label>
                <select
                  value={formData.barcodeFormat || ''}
                  onChange={(e) => handleFormChange('barcodeFormat', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">No Barcode</option>
                  <option value="QR_CODE">QR Code</option>
                  <option value="CODE_128">Code 128</option>
                  <option value="CODE_39">Code 39</option>
                  <option value="EAN_13">EAN 13</option>
                  <option value="UPC_A">UPC A</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'smart-tap':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Smart Tap Redemption Value
                </label>
                <input
                  type="text"
                  value={formData.smartTapRedemptionValue || ''}
                  onChange={(e) => handleFormChange('smartTapRedemptionValue', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Redemption value for smart tap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Authentication Keys
                </label>
                <input
                  type="password"
                  value={formData.authenticationKeys || ''}
                  onChange={(e) => handleFormChange('authenticationKeys', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="NFC authentication keys"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Custom Metadata (JSON)
              </label>
              <textarea
                value={formData.customMetadata || ''}
                onChange={(e) => handleFormChange('customMetadata', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none font-mono text-sm"
                placeholder='{"key": "value", "custom_field": "data"}'
              />
              <p className="text-xs text-gray-500 mt-1">Enter valid JSON format for custom metadata fields</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expirationDate || ''}
                  onChange={(e) => handleFormChange('expirationDate', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Max Uses Per Day
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUsesPerDay || ''}
                  onChange={(e) => handleFormChange('maxUsesPerDay', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Unlimited if empty"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Device Restrictions
              </label>
              <textarea
                value={formData.deviceRestrictions || ''}
                onChange={(e) => handleFormChange('deviceRestrictions', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Specify device compatibility or restrictions"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Callback URL
                </label>
                <input
                  type="url"
                  value={formData.callbackUrl || ''}
                  onChange={(e) => handleFormChange('callbackUrl', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="https://api.company.com/callback"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Notification Email
                </label>
                <input
                  type="email"
                  value={formData.notificationEmail || ''}
                  onChange={(e) => handleFormChange('notificationEmail', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="notifications@company.com"
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderFormFields = () => {
    if (!selectedType) return null

    const commonFields = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleFormChange('title', e.target.value)}
              className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter pass title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Logo Image
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file)
                    }
                  }}
                  className="hidden"
                  id="logo-upload"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="logo-upload"
                  className={`
                    flex-1 h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 
                    flex items-center cursor-pointer hover:bg-white/80 transition-colors
                    ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {uploadingImage ? (
                    <span className="text-gray-500">Uploading...</span>
                  ) : formData.logo ? (
                    <span className="text-green-600">✓ Image uploaded</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload size={16} className="text-gray-400" />
                      <span className="text-gray-500">Choose image file...</span>
                    </div>
                  )}
                </label>
              </div>
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Logo preview"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      handleFormChange('logo', '')
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )

    switch (selectedType) {
      case 'generic':
        return (
          <div>
            {commonFields}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Brand Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.brandColor || '#000000'}
                    onChange={(e) => handleFormChange('brandColor', e.target.value)}
                    className="w-12 h-[44px] rounded-[20px] border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.brandColor || '#000000'}
                    onChange={(e) => handleFormChange('brandColor', e.target.value)}
                    className="flex-1 h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Enter pass description"
              />
            </div>
          </div>
        )

      case 'gift-card':
        return (
          <div>
            {commonFields}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Card Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cardNumber || ''}
                  onChange={(e) => handleFormChange('cardNumber', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Balance <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.balance || ''}
                  onChange={(e) => handleFormChange('balance', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                PIN (Optional)
              </label>
              <input
                type="password"
                value={formData.pin || ''}
                onChange={(e) => handleFormChange('pin', e.target.value)}
                className="w-full md:w-1/2 h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter 4-digit PIN"
                maxLength={4}
              />
            </div>
          </div>
        )

      case 'loyalty':
        return (
          <div>
            {commonFields}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Brand Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.brandColor || '#000000'}
                    onChange={(e) => handleFormChange('brandColor', e.target.value)}
                    className="w-12 h-[44px] rounded-[20px] border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.brandColor || '#000000'}
                    onChange={(e) => handleFormChange('brandColor', e.target.value)}
                    className="flex-1 h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Member Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.memberName || ''}
                  onChange={(e) => handleFormChange('memberName', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter member name"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Points Balance <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.pointsBalance || ''}
                  onChange={(e) => handleFormChange('pointsBalance', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Tier <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tier || ''}
                  onChange={(e) => handleFormChange('tier', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                >
                  <option value="">Select tier</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="diamond">Diamond</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'offer':
        return (
          <div>
            {commonFields}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Offer Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.offerCode || ''}
                  onChange={(e) => handleFormChange('offerCode', e.target.value.toUpperCase())}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="SAVE20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => handleFormChange('expiryDate', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Redemption Instructions <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.redemptionInstructions || ''}
                onChange={(e) => handleFormChange('redemptionInstructions', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Enter instructions on how to redeem this offer"
                required
              />
            </div>
          </div>
        )

      case 'smart-tap':
        return (
          <div>
            {commonFields}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Merchant ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.merchantId || ''}
                  onChange={(e) => handleFormChange('merchantId', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter merchant ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Device Binding ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.deviceBindingId || ''}
                  onChange={(e) => handleFormChange('deviceBindingId', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[20px] bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter device binding ID"
                  required
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Toast Notifications */}
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-[20px] w-full max-w-6xl max-h-[90vh] flex"
        style={{ boxShadow: "rgba(224, 215, 198, 0.5) 0px 5px 20px 0px" }}
      >
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-[24px] font-albert text-black">
                {step === 'select' ? 'Create New Pass' : editPass ? 'Edit Pass' : 'Configure Your Pass'}
              </h2>
              <p className="text-foreground mt-1">
                {step === 'select' 
                  ? 'Choose the type of pass you want to create' 
                  : editPass
                    ? `Editing ${passTypes.find(p => p.id === selectedType)?.name || 'pass'}`
                    : `Setting up your ${passTypes.find(p => p.id === selectedType)?.name}`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Area with Scroll */}
          <div className="flex-1 overflow-y-auto">
            {step === 'select' ? (
              <>
                {/* Pass Type Selection */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {passTypes.map((passType) => (
                      <label
                        key={passType.id}
                        className={`
                          relative cursor-pointer rounded-[16px] p-4 border-2 transition-all hover:shadow-md
                          ${selectedType === passType.id
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="passType"
                          value={passType.id}
                          checked={selectedType === passType.id}
                          onChange={(e) => setSelectedType(e.target.value as PassType)}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{passType.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-medium text-black mb-1">{passType.name}</h3>
                            <p className="text-sm text-foreground">{passType.description}</p>
                          </div>
                          {selectedType === passType.id && (
                            <div className="flex-shrink-0">
                              <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Form Step */}
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl">
                        {passTypes.find(p => p.id === selectedType)?.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-black">
                          {passTypes.find(p => p.id === selectedType)?.name} Configuration
                        </h3>
                        <p className="text-sm text-foreground">
                          Fill in the details for your {passTypes.find(p => p.id === selectedType)?.name.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {renderFormFields()}
                    
                    {/* Additional Settings Section */}
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <button
                        type="button"
                        onClick={() => setShowAdditionalSettings(!showAdditionalSettings)}
                        className="flex items-center justify-between w-full text-left focus:outline-none group"
                      >
                        <div>
                          <h3 className="text-base font-medium text-black group-hover:text-gray-700 transition-colors">
                            Additional Settings
                          </h3>
                          <p className="text-sm text-foreground mt-1">
                            Optional fields for advanced configuration
                          </p>
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            showAdditionalSettings ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {showAdditionalSettings && (
                        <div className="mt-6 animate-in slide-in-from-top-2 duration-200">
                          {renderAdditionalSettingsFields()}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 flex-shrink-0">
            {step === 'select' ? (
              <div className="flex justify-end gap-3 p-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-foreground hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedType}
                  className="px-6 py-2 bg-black text-white rounded-4xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            ) : (
              <div className="flex justify-between p-6">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-foreground hover:text-black transition-colors"
                  disabled={isSubmitting}
                >
                  ← Back
                </button>
                <div className="flex gap-3">
                  {successData?.qrCodeUrl ? (
                    <>
                      <div className="flex items-center gap-3">
                        {successData?.passUrl && successData.passId && (
                          <>
                            <GoogleWalletButton
                              passUrl={successData.passUrl}
                              passId={successData.passId}
                              size="md"
                              variant="primary"
                            />
                            <AppleWalletButton
                              passId={successData.passId}
                              size="md"
                              variant="outline"
                              onError={(error) => console.error('Apple Wallet error:', error)}
                              onSuccess={() => console.log('Apple Wallet pass downloaded')}
                            />
                          </>
                        )}
                        <a
                          href={successData.qrCodeUrl}
                          download="pass-qr-code.png"
                          className="px-4 py-2 bg-green-600 text-white rounded-4xl font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                          onClick={() => {
                            // Track QR code download
                            if (successData.passId) {
                              AnalyticsTracker.trackDownload(successData.passId.toString()).catch(console.warn)
                            }
                          }}
                        >
                          <Download size={16} />
                          Download QR Code
                        </a>
                      </div>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-foreground hover:text-black transition-colors"
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-foreground hover:text-black transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-black text-white rounded-4xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {editPass ? 'Updating Pass...' : 'Creating Pass...'}
                          </>
                        ) : (
                          editPass ? 'Update Pass' : 'Create Pass'
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Preview Panel - Only show in form step */}
        {step === 'form' && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
            {/* Preview Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-medium text-black mb-1">Live Preview</h3>
              <p className="text-sm text-foreground">See how your pass will look</p>
            </div>
            
            {/* Preview Content */}
            <div className="flex-1 p-6 flex flex-col justify-center items-center">
              <div className="w-full max-w-sm">
                <PassCardPreview 
                  passType={selectedType}
                  formData={formData}
                  imagePreview={imagePreview}
                />
                
                {/* QR Code Display */}
                {successData?.qrCodeUrl && (
                  <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">QR Code Ready!</h4>
                      <div className="bg-white p-3 rounded-lg border border-gray-100 inline-block">
                        <img
                          src={successData.qrCodeUrl}
                          alt="Pass QR Code"
                          className="w-32 h-32 object-contain"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                        Customers can scan this QR code to add the pass directly to their mobile wallet
                      </p>
                      <div className="flex items-center justify-center gap-3 mt-4">
                        {successData?.passUrl && successData.passId && (
                          <>
                            <GoogleWalletButton
                              passUrl={successData.passUrl}
                              passId={successData.passId}
                              size="sm"
                              variant="primary"
                            />
                            <AppleWalletButton
                              passId={successData.passId}
                              size="sm"
                              variant="outline"
                              onError={(error) => console.error('Apple Wallet error:', error)}
                              onSuccess={() => console.log('Apple Wallet pass downloaded')}
                            />
                          </>
                        )}
                        <a
                          href={successData.qrCodeUrl}
                          download="pass-qr-code.png"
                          className="inline-flex items-center gap-2 text-xs bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                          onClick={() => {
                            // Track QR code download
                            if (successData.passId) {
                              AnalyticsTracker.trackDownload(successData.passId.toString()).catch(console.warn)
                            }
                          }}
                        >
                          <Download size={12} />
                          Download QR Code
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Preview Notes */}
                {!successData && (
                  <div className="mt-6 text-xs text-gray-500 space-y-1 text-center">
                    <p>• Preview updates as you type</p>
                    <p>• This is how your pass will appear in mobile wallets</p>
                    <p>• Upload a logo to see it in the preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  )
}
