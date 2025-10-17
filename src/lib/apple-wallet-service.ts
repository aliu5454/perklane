import { PKPass } from 'passkit-generator'
import path from 'path'
import fs from 'fs'

/**
 * Apple Wallet Pass Generation Service
 * 
 * Handles creation of .pkpass files for Apple Wallet
 * Supports all pass types: generic, loyalty, gift card, offer, coupon, event ticket, etc.
 */

interface AppleWalletConfig {
  teamId: string
  passTypeId: string
  p12Certificate: string  // Base64 encoded
  wwdrCertificate: string // Base64 encoded
  p12Password?: string
}

interface PassData {
  title: string
  description?: string
  brandColor?: string
  backgroundColor?: string
  foregroundColor?: string
  labelColor?: string
  logo?: string
  icon?: string
  thumbnail?: string
  strip?: string
  header?: string
  footer?: string
  
  // Pass-specific fields
  passType?: string
  organizationName?: string
  serialNumber?: string
  
  // Loyalty - ENHANCED with all form fields (general pass - no member info required)
  points?: string | number
  pointsBalance?: string | number
  pointsLabel?: string
  pointsForReward?: string | number
  rewardDescription?: string
  membershipId?: string
  tier?: string
  tierColor?: string
  nextTier?: string
  pointsToNextTier?: string | number
  membershipExpiry?: string
  expirationDate?: string
  issueDate?: string
  memberName?: string  // Optional - for backward compatibility
  memberSince?: string
  secondaryPointsType?: string
  secondaryPointsBalance?: string | number
  programName?: string
  programWebsite?: string
  nearestLocation?: string
  distanceToNearest?: string
  customerServicePhone?: string
  
  // Visual customization - textColor for loyalty-specific text styling
  textColor?: string
  backgroundImage?: string
  
  // Gift Card - ENHANCED with all form fields
  balance?: string | number
  cardNumber?: string
  pin?: string
  currencyCode?: string
  purchaseLocation?: string
  supportPhone?: string
  
  // Offer/Coupon - ENHANCED with all form fields
  offerDetails?: string
  expiryDate?: string
  discount?: string
  code?: string
  discountType?: string
  discountValue?: string | number
  minimumPurchase?: string | number
  maxRedemptions?: string | number
  locationRestrictions?: string
  finePrint?: string
  providerWebsite?: string
  redemptionInstructions?: string
  
  // Event
  eventName?: string
  eventDate?: string
  venue?: string
  seatInfo?: string
  
  // Generic - ENHANCED
  supportEmail?: string
  websiteUrl?: string
  
  // Smart Tap - NEW
  smartTapRedemptionValue?: string | number
  authenticationKeys?: string
  customMetadata?: string
  maxUsesPerDay?: string | number
  deviceRestrictions?: string
  callbackUrl?: string
  notificationEmail?: string
  merchantId?: string
  deviceBindingId?: string
  
  // Barcode
  barcodeValue?: string
  barcodeFormat?: 'PKBarcodeFormatQR' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec' | 'PKBarcodeFormatCode128'
  barcodeMessage?: string
  
  // Common fields
  termsAndConditions?: string
  
  // Additional fields
  additionalFields?: Array<{ label: string; value: string }>
  backFields?: Array<{ label: string; value: string }>
}

/**
 * Get Apple Wallet configuration from environment variables
 * 
 * NOTE: Variable names are confusing for historical reasons:
 * - APPLE_PASS_PRIVATE_KEY → actually points to key.pem (the private key file) ✅
 * - APPLE_PASS_CERTIFICATE → actually points to certificate.pem (the certificate file) ✅
 */
function getAppleWalletConfig(): AppleWalletConfig {
  const teamId = process.env.APPLE_TEAM_ID
  const passTypeId = process.env.APPLE_PASS_TYPE_ID
  const p12Certificate = process.env.APPLE_PASS_PRIVATE_KEY      // Actually the private key
  const wwdrCertificate = process.env.APPLE_PASS_CERTIFICATE      // Actually the certificate
  const p12Password = process.env.APPLE_P12_PASSWORD

  if (!teamId || !passTypeId || !p12Certificate || !wwdrCertificate) {
    throw new Error('Apple Wallet configuration is incomplete. Check environment variables.')
  }

  return {
    teamId,
    passTypeId,
    p12Certificate,
    wwdrCertificate,
    p12Password
  }
}

/**
 * Load certificate from file path or Base64 string
 * TODO: TESTING ONLY - Remove file path support before production
 */
function loadCertificate(certData: string, name: string): Buffer {
  let buffer: Buffer
  
  // TESTING: Check if it's a file path (for development only)
  if (certData.includes('\\') || certData.includes('/')) {
    console.log(`⚠️  TESTING MODE: Loading ${name} from file path: ${certData}`)
    if (fs.existsSync(certData)) {
      buffer = fs.readFileSync(certData)
    } else {
      throw new Error(`Certificate file not found: ${certData}`)
    }
  } else {
    // Production: Decode from Base64
    buffer = Buffer.from(certData, 'base64')
  }
  
  // Validate and log certificate format
  const bufferStr = buffer.toString('utf8')
  const lines = bufferStr.split('\n')
  
  
  // Check for PEM format
  if (bufferStr.includes('-----BEGIN')) {
    console.log(`   ✅ Format: PEM detected`)
  } else if (buffer[0] === 0x30 && buffer[1] === 0x82) {
    console.log(`   ⚠️  Format: DER/Binary detected (may cause issues, PEM preferred)`)
  } else {
    console.log(`   ❌ Format: Unknown format`)
  }
  console.log('')
  
  return buffer
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Determine pass style based on pass type
 */
function getPassStyle(passType?: string): 'generic' | 'boardingPass' | 'coupon' | 'eventTicket' | 'storeCard' {
  switch (passType) {
    case 'loyalty':
      return 'storeCard'
    case 'gift-card':
      return 'storeCard'
    case 'offer':
    case 'coupon':
      return 'coupon'
    case 'event':
    case 'ticket':
      return 'eventTicket'
    case 'boarding':
      return 'boardingPass'
    default:
      return 'generic'
  }
}

/**
 * Create an Apple Wallet pass
 */
export async function createAppleWalletPass(passData: PassData): Promise<Buffer> {
  const config = getAppleWalletConfig()

  // Load certificates (supports both file paths for testing and Base64 for production)
  // NOTE: Environment variable names are misleading for historical reasons:
  // - APPLE_PASS_PRIVATE_KEY points to key.pem (private key) ✅
  // - APPLE_PASS_CERTIFICATE points to certificate.pem (certificate) ✅
  const privateKeyBuffer = loadCertificate(config.p12Certificate, 'Private Key (key.pem)')
  const certificateBuffer = loadCertificate(config.wwdrCertificate, 'Certificate (certificate.pem)')

  // Determine pass style - MUST be set before creating pass structure
  const passStyle = getPassStyle(passData.passType)
  
  console.log('Creating Apple Wallet pass:', {
    passType: passData.passType,
    passStyle: passStyle,
    title: passData.title
  })

  // Generate unique serial number
  const serialNumber = passData.serialNumber || `PASS-${Date.now()}-${Math.random().toString(36).substring(7)}`

  // Create pass.json structure
  const passJson: any = {
    formatVersion: 1,
    passTypeIdentifier: config.passTypeId,
    serialNumber: serialNumber,
    teamIdentifier: config.teamId,
    organizationName: passData.organizationName || 'Perklane',
    description: passData.description || passData.title,
    
    // Visual appearance
    ...(passData.backgroundColor && { backgroundColor: hexToRgb(passData.backgroundColor) }),
    ...(passData.foregroundColor && { foregroundColor: hexToRgb(passData.foregroundColor) }),
    ...(passData.labelColor && { labelColor: hexToRgb(passData.labelColor) }),
    
    // Barcode/QR Code
    ...(passData.barcodeValue && {
      barcodes: [{
        format: passData.barcodeFormat || 'PKBarcodeFormatQR',
        message: passData.barcodeValue,
        messageEncoding: 'iso-8859-1',
        ...(passData.barcodeMessage && { altText: passData.barcodeMessage })
      }]
    })
  }

  // Add pass-type specific fields
  const passFields: any = {}

  // Header Fields - NO currencyCode allowed here!
  passFields.headerFields = []
  
  if (passData.passType === 'loyalty') {
    const pointsBalance = passData.pointsBalance || passData.points || '0'
    const pointsLabel = passData.pointsLabel || 'POINTS'
    
    passFields.headerFields.push({
      key: 'points',
      label: pointsLabel.toUpperCase(),
      value: pointsBalance.toString()
    })
    
    // Add program name to header if available
    if (passData.programName) {
      passFields.headerFields.push({
        key: 'programName',
        label: 'PROGRAM',
        value: passData.programName
      })
    }
  } else if (passData.passType === 'gift-card' && passData.balance) {
    // Format balance as plain text with currency symbol
    const balanceStr = passData.balance.toString()
    let displayValue = balanceStr
    
    // If balance is already formatted (e.g., "USD 50.00"), convert to symbol format
    if (balanceStr.includes(' ')) {
      const parts = balanceStr.split(' ')
      const currency = parts[0]
      const amount = parts[1]
      displayValue = `${getCurrencySymbol(currency)}${amount}`
    } else if (!balanceStr.startsWith('$') && !balanceStr.startsWith('€')) {
      // If it's just a number, add default currency symbol
      const numValue = parseFloat(balanceStr)
      displayValue = isNaN(numValue) ? balanceStr : `$${numValue.toFixed(2)}`
    }
    
    passFields.headerFields.push({
      key: 'balance',
      label: 'BALANCE',
      value: displayValue
    })
  }

  // Primary Fields (main content) - Program name for general pass
  passFields.primaryFields = []
  
  if (passData.passType === 'loyalty') {
    // For general loyalty pass, show program name or title
    passFields.primaryFields.push({
      key: 'title',
      label: 'LOYALTY PROGRAM',
      value: passData.programName || passData.title
    })
  } else {
    passFields.primaryFields.push({
      key: 'title',
      label: 'TITLE',
      value: passData.title
    })
  }

  // Secondary Fields
  passFields.secondaryFields = []
  
  // Loyalty-specific secondary fields
  if (passData.passType === 'loyalty') {
    // Show tier prominently
    if (passData.tier) {
      passFields.secondaryFields.push({
        key: 'tier',
        label: 'TIER',
        value: passData.tier.toUpperCase()
      })
    }
    
    // Show points for reward if configured
    if (passData.pointsForReward) {
      passFields.secondaryFields.push({
        key: 'pointsForReward',
        label: 'REWARD AT',
        value: `${passData.pointsForReward} ${passData.pointsLabel || 'POINTS'}`
      })
    }
    
    // Show next tier progress if configured
    if (passData.nextTier && passData.pointsToNextTier) {
      passFields.secondaryFields.push({
        key: 'nextTier',
        label: 'NEXT TIER',
        value: `${passData.nextTier} (${passData.pointsToNextTier} ${passData.pointsLabel || 'points'} needed)`
      })
    }
  }
  
  // Generic secondary fields for other pass types
  if (passData.membershipId) {
    passFields.secondaryFields.push({
      key: 'memberId',
      label: 'MEMBER ID',
      value: passData.membershipId
    })
  }
  
  if (passData.cardNumber) {
    passFields.secondaryFields.push({
      key: 'cardNumber',
      label: 'CARD NUMBER',
      value: passData.cardNumber
    })
  }
  
  if (passData.code) {
    passFields.secondaryFields.push({
      key: 'code',
      label: 'CODE',
      value: passData.code
    })
  }

  // Auxiliary Fields
  passFields.auxiliaryFields = []
  
  // Loyalty-specific auxiliary fields
  if (passData.passType === 'loyalty') {
    // Issue date (member since)
    if (passData.issueDate || passData.memberSince) {
      passFields.auxiliaryFields.push({
        key: 'issueDate',
        label: 'ISSUED',
        value: passData.issueDate || passData.memberSince,
        dateStyle: 'PKDateStyleShort'
      })
    }
    
    // Expiration date
    if (passData.expirationDate || passData.membershipExpiry) {
      passFields.auxiliaryFields.push({
        key: 'expirationDate',
        label: 'EXPIRES',
        value: passData.expirationDate || passData.membershipExpiry,
        dateStyle: 'PKDateStyleShort'
      })
    }
    
    // Nearest location
    if (passData.nearestLocation) {
      passFields.auxiliaryFields.push({
        key: 'nearestLocation',
        label: 'NEAREST STORE',
        value: passData.nearestLocation
      })
    }
    
    // Reward description if configured
    if (passData.rewardDescription && passData.pointsForReward) {
      passFields.auxiliaryFields.push({
        key: 'rewardDescription',
        label: 'REWARD',
        value: passData.rewardDescription
      })
    }
  }
  
  // Generic auxiliary fields for other pass types
  if (passData.expiryDate) {
    passFields.auxiliaryFields.push({
      key: 'expires',
      label: 'EXPIRES',
      value: passData.expiryDate,
      dateStyle: 'PKDateStyleShort'
    })
  }
  
  if (passData.membershipExpiry && passData.passType !== 'loyalty') {
    passFields.auxiliaryFields.push({
      key: 'membershipExpiry',
      label: 'VALID UNTIL',
      value: passData.membershipExpiry,
      dateStyle: 'PKDateStyleShort'
    })
  }
  
  if (passData.discount) {
    passFields.auxiliaryFields.push({
      key: 'discount',
      label: 'DISCOUNT',
      value: passData.discount
    })
  }

  // Add custom additional fields
  if (passData.additionalFields && passData.additionalFields.length > 0) {
    passData.additionalFields.forEach((field, index) => {
      passFields.auxiliaryFields.push({
        key: `custom_${index}`,
        label: field.label.toUpperCase(),
        value: field.value
      })
    })
  }

  // Back Fields (shown on back of pass)
  passFields.backFields = []
  
  // Loyalty-specific back fields
  if (passData.passType === 'loyalty') {
    // Program description
    if (passData.description) {
      passFields.backFields.push({
        key: 'description',
        label: 'ABOUT THIS PROGRAM',
        value: passData.description
      })
    }
    
    // Program website
    if (passData.programWebsite) {
      passFields.backFields.push({
        key: 'programWebsite',
        label: 'WEBSITE',
        value: passData.programWebsite
      })
    }
    
    // Customer service
    if (passData.customerServicePhone) {
      passFields.backFields.push({
        key: 'customerService',
        label: 'CUSTOMER SERVICE',
        value: passData.customerServicePhone
      })
    }
    
    // Distance to nearest location
    if (passData.distanceToNearest && passData.nearestLocation) {
      passFields.backFields.push({
        key: 'distanceInfo',
        label: 'LOCATION INFO',
        value: `${passData.nearestLocation} - ${passData.distanceToNearest}`
      })
    }
    
    // Tier progress details
    if (passData.nextTier && passData.pointsToNextTier) {
      const currentPoints = parseInt(passData.pointsBalance?.toString() || '0')
      const pointsNeeded = parseInt(passData.pointsToNextTier.toString())
      const progress = Math.round((currentPoints / (currentPoints + pointsNeeded)) * 100)
      
      passFields.backFields.push({
        key: 'tierProgress',
        label: 'TIER PROGRESS',
        value: `${progress}% to ${passData.nextTier} tier. Earn ${pointsNeeded} more ${passData.pointsLabel || 'points'} to upgrade.`
      })
    }
  }
  
  // Generic back fields for other pass types
  if (passData.offerDetails) {
    passFields.backFields.push({
      key: 'offerDetails',
      label: 'OFFER DETAILS',
      value: passData.offerDetails
    })
  }
  
  if (passData.description && passData.passType !== 'loyalty') {
    passFields.backFields.push({
      key: 'description',
      label: 'DESCRIPTION',
      value: passData.description
    })
  }

  // Add custom back fields
  if (passData.backFields && passData.backFields.length > 0) {
    passData.backFields.forEach((field, index) => {
      passFields.backFields.push({
        key: `back_${index}`,
        label: field.label.toUpperCase(),
        value: field.value
      })
    })
  }

  // Add fields to pass based on style
  passJson[passStyle] = passFields

  try {
    // Create the pass without a template (programmatically)
    // CRITICAL: signerCert must be CERTIFICATE, signerKey must be PRIVATE KEY
    const pass = new PKPass(
      {
        'pass.json': Buffer.from(JSON.stringify(passJson))
      },
      {
        wwdr: certificateBuffer,           // Apple WWDR certificate (for testing, using our cert)
        signerCert: certificateBuffer,     // ✅ MUST be certificate (-----BEGIN CERTIFICATE-----)
        signerKey: privateKeyBuffer,       // ✅ MUST be private key (-----BEGIN PRIVATE KEY-----)
        signerKeyPassphrase: config.p12Password || ''
      },
      {
        // Pass model/structure is already in pass.json
      }
    )

    // Add images to the pass
    if (passData.logo) {
      try {
        const logoBuffer = await downloadImage(passData.logo)
        if (logoBuffer.length > 0) {
          pass.addBuffer('logo.png', logoBuffer)
          // Add @2x and @3x versions if needed
          pass.addBuffer('logo@2x.png', logoBuffer)
        }
      } catch (err) {
        console.warn('Failed to add logo:', err)
      }
    }

    if (passData.icon) {
      try {
        const iconBuffer = await downloadImage(passData.icon)
        if (iconBuffer.length > 0) {
          pass.addBuffer('icon.png', iconBuffer)
          pass.addBuffer('icon@2x.png', iconBuffer)
        }
      } catch (err) {
        console.warn('Failed to add icon:', err)
      }
    }

    if (passData.thumbnail) {
      try {
        const thumbnailBuffer = await downloadImage(passData.thumbnail)
        if (thumbnailBuffer.length > 0) {
          pass.addBuffer('thumbnail.png', thumbnailBuffer)
          pass.addBuffer('thumbnail@2x.png', thumbnailBuffer)
        }
      } catch (err) {
        console.warn('Failed to add thumbnail:', err)
      }
    }

    if (passData.strip) {
      try {
        const stripBuffer = await downloadImage(passData.strip)
        if (stripBuffer.length > 0) {
          pass.addBuffer('strip.png', stripBuffer)
          pass.addBuffer('strip@2x.png', stripBuffer)
          console.log('✅ Strip image added to pass')
        }
      } catch (err) {
        console.warn('Failed to add strip image:', err)
      }
    }

    // Add background image if provided (full-width background for pass)
    if (passData.backgroundImage) {
      try {
        const backgroundBuffer = await downloadImage(passData.backgroundImage)
        if (backgroundBuffer.length > 0) {
          pass.addBuffer('background.png', backgroundBuffer)
          pass.addBuffer('background@2x.png', backgroundBuffer)
          console.log('✅ Background image added to pass')
        }
      } catch (err) {
        console.warn('Failed to add background image:', err)
      }
    }

    // Generate the .pkpass file
    const buffer = pass.getAsBuffer()
    return buffer

  } catch (error: any) {
    console.error('Error creating Apple Wallet pass:', error)
    throw new Error(`Failed to create Apple Wallet pass: ${error.message}`)
  }
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.warn(`Failed to download image from ${url}:`, error)
    // Return a placeholder or empty buffer
    return Buffer.alloc(0)
  }
}

/**
 * Update an existing Apple Wallet pass
 */
export async function updateAppleWalletPass(
  serialNumber: string,
  updatedData: Partial<PassData>
): Promise<Buffer> {
  // For Apple Wallet, updates are typically pushed via push notifications
  // For now, we'll create a new pass with the updated data
  return createAppleWalletPass({
    ...updatedData,
    serialNumber
  } as PassData)
}

/**
 * Get currency symbol from currency code
 */
function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF ',
    'SEK': 'kr',
    'NZD': 'NZ$',
    'MXN': 'Mex$',
    'BRL': 'R$',
    'ZAR': 'R',
    'RUB': '₽',
    'KRW': '₩'
  }
  
  return symbols[currencyCode] || currencyCode + ' '
}

/**
 * Validate Apple Wallet configuration
 */
export function validateAppleWalletConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!process.env.APPLE_TEAM_ID) {
    errors.push('APPLE_TEAM_ID is not set')
  }

  if (!process.env.APPLE_PASS_TYPE_ID) {
    errors.push('APPLE_PASS_TYPE_ID is not set')
  }

  if (!process.env.APPLE_PASS_PRIVATE_KEY) {
    errors.push('APPLE_PASS_PRIVATE_KEY is not set')
  }

  if (!process.env.APPLE_PASS_CERTIFICATE) {
    errors.push('APPLE_PASS_CERTIFICATE is not set')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
