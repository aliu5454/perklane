import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAppleWalletPass, validateAppleWalletConfig } from '@/lib/apple-wallet-service'
import { createClient } from '@supabase/supabase-js'

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

/**
 * Apple Wallet Pass Generation API
 * 
 * Generates .pkpass files for Apple Wallet
 * 
 * @param req Request containing { passId, publicAccess? } to generate Apple Wallet pass for existing pass
 * @returns .pkpass file as binary response
 */
export async function POST(req: Request) {
  try {
    const { passId, publicAccess } = await req.json()

    if (!passId) {
      return NextResponse.json(
        { error: 'passId is required' },
        { status: 400 }
      )
    }

    // Check authentication only if not public access (for QR code scanning)
    let userEmail: string | undefined
    if (!publicAccess) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      userEmail = session.user.email
    }

    // Validate Apple Wallet configuration
    const configValidation = validateAppleWalletConfig()
    if (!configValidation.isValid) {
      console.error('Apple Wallet configuration invalid:', configValidation.errors)
      return NextResponse.json(
        {
          error: 'Apple Wallet is not configured',
          details: configValidation.errors
        },
        { status: 500 }
      )
    }

    // Fetch the pass from database
    let query = supabase
      .from('passes')
      .select('*')
      .eq('id', passId)
    
    // Only filter by user email if authenticated
    if (userEmail) {
      query = query.eq('user_email', userEmail)
    }
    
    const { data: pass, error: fetchError } = await query.single()

    if (fetchError || !pass) {
      console.error('Error fetching pass:', fetchError)
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      )
    }

    console.log('Generating Apple Wallet pass for:', {
      passId: pass.id,
      passType: pass.pass_type,
      title: pass.pass_data?.title
    })

    // Map Google Wallet pass data to Apple Wallet format
    const passData = mapToAppleWalletFormat(pass)

    // Generate the Apple Wallet pass
    const pkpassBuffer = await createAppleWalletPass(passData)

    // Store the Apple Wallet pass URL in the database
    const applePassUrl = `/api/apple-wallet/download/${pass.id}`
    
    await supabase
      .from('passes')
      .update({
        apple_pass_url: applePassUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', pass.id)

    // Return the .pkpass file
    return new NextResponse(pkpassBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(pass.pass_data?.title || 'pass')}.pkpass"`,
        'Content-Length': pkpassBuffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error('Apple Wallet pass generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate Apple Wallet pass',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Download an existing Apple Wallet pass
 */
export async function GET(req: Request) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const passId = url.pathname.split('/').pop()

    if (!passId) {
      return NextResponse.json(
        { error: 'passId is required' },
        { status: 400 }
      )
    }

    // Fetch the pass from database
    const { data: pass, error: fetchError } = await supabase
      .from('passes')
      .select('*')
      .eq('id', passId)
      .eq('user_email', session.user.email)
      .single()

    if (fetchError || !pass) {
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      )
    }

    // Map and generate the Apple Wallet pass
    const passData = mapToAppleWalletFormat(pass)
    const pkpassBuffer = await createAppleWalletPass(passData)

    // Return the .pkpass file
    return new NextResponse(pkpassBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(pass.pass_data?.title || 'pass')}.pkpass"`,
        'Content-Length': pkpassBuffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error('Apple Wallet pass download error:', error)
    return NextResponse.json(
      {
        error: 'Failed to download Apple Wallet pass',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Map Google Wallet pass data to Apple Wallet format
 * Ensures ALL user input fields are preserved and mapped correctly
 */
function mapToAppleWalletFormat(pass: any): any {
  const passData = pass.pass_data || {}
  
  // Helper to format currency values
  const formatCurrency = (value: any, currencyCode?: string) => {
    if (!value) return undefined
    const currency = currencyCode || passData.currencyCode || 'USD'
    return `${currency} ${parseFloat(value).toFixed(2)}`
  }
  
  return {
    // Core fields
    title: passData.title || 'Pass',
    description: passData.description,
    organizationName: passData.brandName || 'Perklane',
    passType: pass.pass_type,
    serialNumber: pass.object_id,
    
    // Colors
    backgroundColor: passData.brandColor || passData.backgroundColor || '#000000',
    foregroundColor: passData.textColor || '#FFFFFF',
    labelColor: passData.labelColor || '#999999',
    
    // Images
    logo: passData.logo || passData.logoUrl,
    icon: passData.icon || passData.logo || passData.logoUrl,
    thumbnail: passData.thumbnail,
    strip: passData.heroImage || passData.stripImage,
    
    // Barcode - support different formats from form
    barcodeValue: passData.barcodeValue || pass.object_id,
    barcodeFormat: mapBarcodeFormat(passData.barcodeFormat),
    barcodeMessage: passData.barcodeMessage,
    
    // Pass-type specific fields - ENHANCED with all user inputs
    ...(pass.pass_type === 'loyalty' && {
      // Primary loyalty fields
      points: passData.pointsBalance || passData.points || passData.loyaltyPoints,
      membershipId: passData.membershipId || passData.accountId,
      tier: passData.tier || passData.membershipLevel,
      membershipExpiry: passData.membershipExpiry || passData.expirationDate || passData.expiryDate,
      
      // Additional loyalty fields from form
      memberName: passData.memberName,
      secondaryPointsType: passData.secondaryPointsType,
      secondaryPointsBalance: passData.secondaryPointsBalance,
      programWebsite: passData.programWebsite,
      customerServicePhone: passData.customerServicePhone,
    }),
    
    ...(pass.pass_type === 'gift-card' && {
      // Primary gift card fields
      balance: passData.balance || passData.cardBalance || formatCurrency(passData.balance || passData.cardBalance, passData.currencyCode),
      cardNumber: passData.cardNumber || passData.accountId,
      
      // Additional gift card fields from form
      pin: passData.pin,
      expiryDate: passData.expirationDate || passData.expiryDate,
      purchaseLocation: passData.purchaseLocation,
      supportPhone: passData.supportPhone,
    }),
    
    ...(pass.pass_type === 'offer' && {
      // Primary offer fields
      offerDetails: passData.offerDetails || passData.description,
      expiryDate: passData.expiryDate || passData.expirationDate || passData.validUntil,
      discount: passData.discount || formatDiscountValue(passData.discountType, passData.discountValue),
      code: passData.offerCode || passData.code || passData.promoCode,
      
      // Additional offer fields from form
      discountType: passData.discountType,
      discountValue: passData.discountValue,
      minimumPurchase: passData.minimumPurchase,
      maxRedemptions: passData.maxRedemptions,
      locationRestrictions: passData.locationRestrictions,
      finePrint: passData.finePrint,
      providerWebsite: passData.providerWebsite,
      redemptionInstructions: passData.redemptionInstructions,
    }),
    
    ...(pass.pass_type === 'event' && {
      eventName: passData.eventName || passData.title,
      eventDate: passData.eventDate || passData.date,
      venue: passData.venue || passData.location,
      seatInfo: passData.seatInfo
    }),
    
    ...(pass.pass_type === 'generic' && {
      // Generic pass specific fields from form
      expiryDate: passData.expirationDate || passData.expiryDate,
      supportEmail: passData.supportEmail,
      websiteUrl: passData.websiteUrl,
    }),
    
    ...(pass.pass_type === 'smart-tap' && {
      // Smart Tap specific fields from form
      smartTapRedemptionValue: passData.smartTapRedemptionValue,
      authenticationKeys: passData.authenticationKeys,
      customMetadata: passData.customMetadata,
      expiryDate: passData.expirationDate || passData.expiryDate,
      maxUsesPerDay: passData.maxUsesPerDay,
      deviceRestrictions: passData.deviceRestrictions,
      callbackUrl: passData.callbackUrl,
      notificationEmail: passData.notificationEmail,
      merchantId: passData.merchantId,
      deviceBindingId: passData.deviceBindingId,
    }),
    
    // Common additional fields
    termsAndConditions: passData.termsConditions,
    
    // Additional fields from pass_data - capture anything not explicitly mapped
    additionalFields: extractAdditionalFields(passData, pass.pass_type),
    backFields: extractBackFields(passData, pass.pass_type)
  }
}

/**
 * Map barcode format from Google Wallet to Apple Wallet format
 */
function mapBarcodeFormat(format?: string): string {
  const formatMap: Record<string, string> = {
    'QR_CODE': 'PKBarcodeFormatQR',
    'CODE_128': 'PKBarcodeFormatCode128',
    'PDF417': 'PKBarcodeFormatPDF417',
    'AZTEC': 'PKBarcodeFormatAztec',
    'CODE_39': 'PKBarcodeFormatCode128', // Apple doesn't have CODE_39, use CODE_128
    'EAN_13': 'PKBarcodeFormatCode128',  // Apple doesn't have EAN_13, use CODE_128
    'UPC_A': 'PKBarcodeFormatCode128',   // Apple doesn't have UPC_A, use CODE_128
  }
  
  return formatMap[format || 'QR_CODE'] || 'PKBarcodeFormatQR'
}

/**
 * Format discount value based on type
 */
function formatDiscountValue(discountType?: string, discountValue?: any): string | undefined {
  if (!discountValue) return undefined
  
  switch (discountType) {
    case 'percentage':
      return `${discountValue}% off`
    case 'fixed':
      return `$${discountValue} off`
    case 'buy_one_get_one':
      return 'Buy One Get One'
    case 'free_shipping':
      return 'Free Shipping'
    default:
      return discountValue.toString()
  }
}

/**
 * Extract additional fields from pass data
 * Enhanced to handle pass-type specific fields properly
 */
function extractAdditionalFields(passData: any, passType?: string): Array<{ label: string; value: string }> {
  const fields: Array<{ label: string; value: string }> = []
  
  // Define keys that are already explicitly mapped
  const mappedKeys = [
    'title', 'description', 'brandColor', 'backgroundColor', 'textColor', 'labelColor',
    'logo', 'logoUrl', 'icon', 'thumbnail', 'heroImage', 'stripImage', 'brandName',
    'barcodeValue', 'barcodeFormat', 'barcodeMessage',
    // Loyalty
    'pointsBalance', 'points', 'loyaltyPoints', 'membershipId', 'accountId', 
    'tier', 'membershipLevel', 'membershipExpiry', 'expirationDate', 'expiryDate',
    'memberName', 'secondaryPointsType', 'secondaryPointsBalance', 
    'programWebsite', 'customerServicePhone',
    // Gift Card
    'balance', 'cardBalance', 'cardNumber', 'pin', 'currencyCode', 
    'purchaseLocation', 'supportPhone',
    // Offer
    'offerDetails', 'validUntil', 'discount', 'offerCode', 'code', 'promoCode',
    'discountType', 'discountValue', 'minimumPurchase', 'maxRedemptions',
    'locationRestrictions', 'finePrint', 'providerWebsite', 'redemptionInstructions',
    // Event
    'eventName', 'eventDate', 'date', 'venue', 'location', 'seatInfo',
    // Generic
    'supportEmail', 'websiteUrl',
    // Smart Tap
    'smartTapRedemptionValue', 'authenticationKeys', 'customMetadata',
    'maxUsesPerDay', 'deviceRestrictions', 'callbackUrl', 'notificationEmail',
    'merchantId', 'deviceBindingId',
    // Common
    'termsConditions'
  ]
  
  Object.keys(passData).forEach(key => {
    if (!mappedKeys.includes(key) && passData[key]) {
      const value = passData[key]
      if (typeof value === 'string' || typeof value === 'number') {
        fields.push({
          label: formatLabel(key),
          value: value.toString()
        })
      }
    }
  })
  
  return fields
}

/**
 * Extract back fields from pass data
 * Enhanced to include pass-type specific information
 */
function extractBackFields(passData: any, passType?: string): Array<{ label: string; value: string }> {
  const fields: Array<{ label: string; value: string }> = []
  
  // Terms & Conditions
  if (passData.termsConditions) {
    fields.push({
      label: 'Terms & Conditions',
      value: passData.termsConditions
    })
  }
  
  // Website
  if (passData.websiteUrl || passData.programWebsite || passData.providerWebsite) {
    fields.push({
      label: 'Website',
      value: passData.websiteUrl || passData.programWebsite || passData.providerWebsite
    })
  }
  
  // Contact Information
  if (passData.supportEmail) {
    fields.push({
      label: 'Support Email',
      value: passData.supportEmail
    })
  }
  
  if (passData.customerServicePhone || passData.supportPhone) {
    fields.push({
      label: 'Contact Phone',
      value: passData.customerServicePhone || passData.supportPhone
    })
  }
  
  // Offer specific back fields
  if (passType === 'offer') {
    if (passData.finePrint) {
      fields.push({
        label: 'Fine Print',
        value: passData.finePrint
      })
    }
    
    if (passData.locationRestrictions) {
      fields.push({
        label: 'Location Restrictions',
        value: passData.locationRestrictions
      })
    }
    
    if (passData.redemptionInstructions) {
      fields.push({
        label: 'Redemption Instructions',
        value: passData.redemptionInstructions
      })
    }
  }
  
  // Smart Tap specific back fields
  if (passType === 'smart-tap') {
    if (passData.deviceRestrictions) {
      fields.push({
        label: 'Device Restrictions',
        value: passData.deviceRestrictions
      })
    }
    
    if (passData.callbackUrl) {
      fields.push({
        label: 'Callback URL',
        value: passData.callbackUrl
      })
    }
  }
  
  return fields
}

/**
 * Format a camelCase or snake_case string to Title Case
 */
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
}
