interface TrackEventParams {
  passId: string
  eventType: 'view' | 'download' | 'add_to_wallet' | 'scan'
  customerEmail?: string
  customerName?: string
  deviceInfo?: {
    platform?: string
    model?: string
    os_version?: string
    browser?: string
  }
  locationInfo?: {
    city?: string
    country?: string
    lat?: number
    lng?: number
  }
  metadata?: Record<string, any>
}

export class AnalyticsTracker {
  private static async getDeviceInfo() {
    const userAgent = navigator.userAgent
    let platform = 'Unknown'
    let browser = 'Unknown'
    
    // Detect platform
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      platform = 'iOS'
    } else if (userAgent.includes('Android')) {
      platform = 'Android'
    } else if (userAgent.includes('Windows')) {
      platform = 'Windows'
    } else if (userAgent.includes('Mac')) {
      platform = 'macOS'
    } else if (userAgent.includes('Linux')) {
      platform = 'Linux'
    }

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome'
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari'
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge'
    }

    return {
      platform,
      browser,
      user_agent: userAgent
    }
  }

  private static async getLocationInfo() {
    try {
      // Try to get location from IP (using a free service)
      const response = await fetch('https://ipapi.co/json/')
      if (response.ok) {
        const data = await response.json()
        return {
          city: data.city,
          country: data.country_name,
          lat: data.latitude,
          lng: data.longitude
        }
      }
    } catch (error) {
      console.warn('Could not get location info:', error)
    }
    
    return null
  }

  static async trackEvent({
    passId,
    eventType,
    customerEmail,
    customerName,
    deviceInfo: providedDeviceInfo,
    locationInfo: providedLocationInfo,
    metadata
  }: TrackEventParams): Promise<boolean> {
    try {
      // Validate required parameters
      if (!passId || !eventType) {
        console.warn('Analytics tracking: Missing required parameters', { passId, eventType })
        return false
      }

      // Validate passId is a valid identifier
      if (typeof passId !== 'string' || passId.trim() === '') {
        console.warn('Analytics tracking: Invalid passId', { passId })
        return false
      }

      // Validate eventType
      const validEventTypes = ['view', 'download', 'add_to_wallet', 'scan']
      if (!validEventTypes.includes(eventType)) {
        console.warn('Analytics tracking: Invalid eventType', { eventType, valid: validEventTypes })
        return false
      }

      // Get device info if not provided
      const deviceInfo = providedDeviceInfo || await this.getDeviceInfo()
      
      // Get location info if not provided and event is significant
      const locationInfo = providedLocationInfo || 
        (eventType === 'add_to_wallet' || eventType === 'scan' ? await this.getLocationInfo() : null)

      const payload = {
        passId: passId.trim(),
        eventType,
        customerEmail: customerEmail?.trim() || undefined,
        customerName: customerName?.trim() || undefined,
        deviceInfo,
        locationInfo,
        metadata
      }

      // Log payload for debugging (remove sensitive info)
      console.debug('Analytics tracking payload:', {
        passId: payload.passId,
        eventType: payload.eventType,
        hasCustomerEmail: !!payload.customerEmail,
        hasDeviceInfo: !!payload.deviceInfo
      })

      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.warn('Analytics tracking failed:', await response.text())
        return false
      }

      const result = await response.json()
      if (!result.success) {
        console.warn('Analytics tracking failed:', result.error)
        return false
      }

      return true
    } catch (error) {
      console.warn('Analytics tracking error:', error)
      return false
    }
  }

  // Convenience methods for specific events
  static async trackView(passId: string, customerInfo?: { email?: string; name?: string }) {
    if (!passId || typeof passId !== 'string') {
      console.warn('Analytics trackView: Invalid passId', { passId })
      return false
    }
    
    return this.trackEvent({
      passId,
      eventType: 'view',
      customerEmail: customerInfo?.email,
      customerName: customerInfo?.name
    })
  }

  static async trackDownload(passId: string, customerInfo?: { email?: string; name?: string }) {
    if (!passId || typeof passId !== 'string') {
      console.warn('Analytics trackDownload: Invalid passId', { passId })
      return false
    }
    
    return this.trackEvent({
      passId,
      eventType: 'download',
      customerEmail: customerInfo?.email,
      customerName: customerInfo?.name
    })
  }

  static async trackAddToWallet(passId: string, customerInfo?: { email?: string; name?: string }) {
    if (!passId || typeof passId !== 'string') {
      console.warn('Analytics trackAddToWallet: Invalid passId', { passId })
      return false
    }
    
    return this.trackEvent({
      passId,
      eventType: 'add_to_wallet',
      customerEmail: customerInfo?.email,
      customerName: customerInfo?.name
    })
  }

  static async trackScan(passId: string, customerInfo?: { email?: string; name?: string }, location?: { lat: number; lng: number }) {
    if (!passId || typeof passId !== 'string') {
      console.warn('Analytics trackScan: Invalid passId', { passId })
      return false
    }
    
    return this.trackEvent({
      passId,
      eventType: 'scan',
      customerEmail: customerInfo?.email,
      customerName: customerInfo?.name,
      locationInfo: location ? {
        lat: location.lat,
        lng: location.lng
      } : undefined
    })
  }
}

// Hook for React components
import { useCallback } from 'react'

export function useAnalytics() {
  const trackEvent = useCallback(async (params: TrackEventParams) => {
    return AnalyticsTracker.trackEvent(params)
  }, [])

  const trackView = useCallback(async (passId: string, customerInfo?: { email?: string; name?: string }) => {
    return AnalyticsTracker.trackView(passId, customerInfo)
  }, [])

  const trackDownload = useCallback(async (passId: string, customerInfo?: { email?: string; name?: string }) => {
    return AnalyticsTracker.trackDownload(passId, customerInfo)
  }, [])

  const trackAddToWallet = useCallback(async (passId: string, customerInfo?: { email?: string; name?: string }) => {
    return AnalyticsTracker.trackAddToWallet(passId, customerInfo)
  }, [])

  const trackScan = useCallback(async (passId: string, customerInfo?: { email?: string; name?: string }, location?: { lat: number; lng: number }) => {
    return AnalyticsTracker.trackScan(passId, customerInfo, location)
  }, [])

  return {
    trackEvent,
    trackView,
    trackDownload,
    trackAddToWallet,
    trackScan
  }
}