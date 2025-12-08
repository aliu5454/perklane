import { NextResponse } from "next/server";
import { GoogleAuth } from 'google-auth-library'
import { google } from 'googleapis'
import * as jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGoogleServiceAccount } from '@/lib/google-service-account'

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
 * Google Wallet Pass Creation API
 * 
 * Implements the standard Google Wallet workflow:
 * 1. Create genericClass/loyaltyClass/giftCardClass/offerClass (reusable across users)
 * 2. Create genericObject/loyaltyObject/giftCardObject/offerObject (unique per user)
 * 3. Generate Save link JWT containing the object ID
 * 4. Convert Save link to QR code
 * 5. Store pass details in database
 * 
 * Supports Smart Tap configuration for loyalty, gift card, and offer passes.
 * 
 * @param req Request containing { passType, passData, metadata, smartTapConfig? }
 * @returns Success response with workflow details and pass URLs, or error response
 */
export async function POST(req: Request) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: "Authentication required" 
      }, { status: 401 });
    }

    const { passType, passData, metadata, smartTapConfig } = await req.json();

    console.log('Received pass creation request:', {
      passType,
      passDataKeys: Object.keys(passData || {}),
      hasTitle: !!passData?.title,
      title: passData?.title
    });

    // Validate pass data before proceeding
    const validation = validatePassData(passType, passData);
    if (!validation.isValid) {
      console.error('Pass data validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        error: `Pass data validation failed: ${validation.errors.join(', ')}`,
        validationErrors: validation.errors,
        step: 'validation',
        receivedData: {
          passType,
          passDataKeys: Object.keys(passData),
          title: passData.title
        }
      }, { status: 400 });
    }

    // Normalize date fields
    if (passData.expiryDate) passData.expiryDate = formatDateForGoogleWallet(passData.expiryDate);
    if (passData.validUntil) passData.validUntil = formatDateForGoogleWallet(passData.validUntil);
    if (passData.validFrom) passData.validFrom = formatDateForGoogleWallet(passData.validFrom);
    if (passData.eventDate) passData.eventDate = formatDateForGoogleWallet(passData.eventDate);
    if (passData.membershipExpiry) passData.membershipExpiry = formatDateForGoogleWallet(passData.membershipExpiry);
    if (passData.expirationDate) passData.expirationDate = formatDateForGoogleWallet(passData.expirationDate);

    // Initialize Google Auth and Wallet API client
    console.log('🔑 Initializing Google Auth...')
    const auth = new GoogleAuth({
      credentials: getGoogleServiceAccount(),
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
    })

    console.log('📱 Creating Wallet API client...')
    const walletClient = google.walletobjects({
      version: 'v1',
      auth: auth
    })

    // Generate IDs following Google Wallet best practices
    const timestamp = Date.now();
    const userHash = Buffer.from(session.user.email).toString('base64').substring(0, 8);
    
    // Classes: force unique IDs per creation to avoid updating previous passes that share a class
    const contentHash = Buffer.from(JSON.stringify({
      title: passData.title || 'default',
      type: passType,
      brandColor: passData.brandColor,
      logo: passData.logo
    })).toString('base64').substring(0, 8).replace(/[^a-zA-Z0-9]/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 6); // keep IDs short and unique
    const classId = `${process.env.GOOGLE_WALLET_ISSUER_ID}.${passType}_class_${contentHash}_${uniqueSuffix}`;

    // Objects: always unique per-user
    const objectId = `${process.env.GOOGLE_WALLET_ISSUER_ID}.${passType}_object_${userHash}_${timestamp}`;

    console.log(`Starting Google Wallet workflow for ${passType}:`)
    console.log(`1. Class ID (content-based): ${classId}`)
    console.log(`2. Object ID (user-unique): ${objectId}`)

    // Create pass class and object based on type
    let classPayload, objectPayload

    switch (passType) {
      case 'loyalty':
        console.log('Creating loyalty class and object...')
        classPayload = createLoyaltyClass(classId, passData, smartTapConfig)
        objectPayload = createLoyaltyObject(objectId, classId, passData)
        break
      case 'gift-card':
        console.log('Creating gift card class and object...')
        classPayload = createGiftCardClass(classId, passData, smartTapConfig)
        objectPayload = createGiftCardObject(objectId, classId, passData)
        break
      case 'offer':
        console.log('Creating offer class and object...')
        classPayload = createOfferClass(classId, passData, smartTapConfig)
        objectPayload = createOfferObject(objectId, classId, passData)
        break
      case 'generic':
        console.log('Creating generic class and object...')
        classPayload = createGenericClass(classId, passData)
        objectPayload = createGenericObject(objectId, classId, passData)
        break
      default:
        throw new Error(`Unsupported pass type: ${passType}`)
    }

    // STEP 1: Create or verify the pass class exists
    console.log('STEP 1: Creating/verifying class...')
    const classResult = await createOrGetClass(walletClient, passType, classId, classPayload)
    
    if (!classResult.success) {
      return NextResponse.json({
        success: false,
        error: classResult.error,
        errorType: classResult.errorType,
        step: 'class_creation'
      }, { status: 400 });
    }

    // STEP 2: Create the pass object
    console.log('STEP 2: Creating pass object...')
    const objectResult = await createPassObject(walletClient, passType, objectId, objectPayload)
    
    if (!objectResult.success) {
      return NextResponse.json({
        success: false,
        error: objectResult.error,
        errorType: objectResult.errorType,
        step: 'object_creation'
      }, { status: 400 });
    }

    // STEP 3: Generate Save link JWT with full class/object definitions
    console.log('STEP 3: Generating Save link JWT with embedded class/object data...')
    const jwtResult = generateSaveJWT(objectId, passType, classPayload, objectPayload)
    
    // STEP 4: Store in database (QR code will be generated after we have the pass ID)
    console.log('STEP 4: Storing pass in database...')
    
    // First, test if we can access the passes table
    try {
      const { error: testError } = await supabase
        .from('passes')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Cannot access passes table:', testError);
        return NextResponse.json({
          success: false,
          error: `Database table access failed: ${testError.message}`,
          errorType: 'DATABASE_ACCESS_ERROR',
          step: 'database_access_test',
          hint: 'The passes table may not exist or RLS policies may be blocking access'
        }, { status: 500 });
      }
      console.log('✅ Database table access verified');
    } catch (accessError) {
      console.error('❌ Database access test failed:', accessError);
      return NextResponse.json({
        success: false,
        error: 'Database connection or table access failed',
        errorType: 'DATABASE_CONNECTION_ERROR',
        step: 'database_access_test'
      }, { status: 500 });
    }
    
    console.log('Database insertion data:', {
      user_email: session.user.email,
      pass_type: passType,
      title: passData.title || 'Untitled Pass',
      class_id: classId,
      object_id: objectId,
      status: 'active'
    });

    let passRecord = null;
    
    // Try to insert the new pass (without QR code URL initially)
    const { data: insertData, error: dbError } = await supabase
      .from('passes')
      .insert({
        user_email: session.user.email,
        pass_type: passType,
        title: passData.title || 'Untitled Pass',
        pass_data: passData,
        class_id: classId,
        object_id: objectId,
        qr_code_url: '', // Will be updated after pass ID is known
        pass_url: jwtResult.saveUrl,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insertion failed:', dbError);
      
      // Check if it's a unique constraint violation on class_id
      if (dbError.code === '23505' && dbError.message?.includes('class_id')) {
        console.log('⚠️ Class ID already exists. This is expected for reusable classes.');
        console.log('✅ Pass creation successful - class sharing is working correctly');
        
        // Return success since the Google Wallet objects were created successfully
        return NextResponse.json({
          success: true,
          message: "Google Wallet pass created successfully",
          passId: null, // No pass ID since DB insertion was skipped
          note: "Class ID reused (this is expected behavior for shared pass classes)",
          workflow: {
            step1_class: { id: classId, status: 'existing (shared)' },
            step2_object: { id: objectId, status: 'created' },
            step3_jwt: { generated: true },
            step4_database: { status: 'skipped_due_to_constraint' },
            step5_qr: { status: 'not_generated' }
          },
          passUrl: jwtResult.saveUrl,
          qrCodeUrl: null,
          fallbackQrCodeUrl: null,
          qrCodeInfo: null,
          passData,
          metadata
        });
      }
      
      // For other database errors, return failure
      return NextResponse.json({
        success: false,
        error: `Database insertion failed: ${dbError.message}`,
        errorType: 'DATABASE_ERROR',
        step: 'database_insertion'
      }, { status: 500 });
    }

    // Success case
    console.log('✅ Pass successfully stored in database:', insertData?.id);
    passRecord = insertData;

    // STEP 6: Generate QR code pointing to wallet selection page
    console.log('STEP 6: Generating QR code for wallet selection page...')
    const baseUrl = process.env.NEXTAUTH_URL || 'https://perklane.com'
    const walletSelectionUrl = `${baseUrl}/pass/${passRecord.id}`
    const selectionQrCodes = await generateWalletSelectionQRCode(walletSelectionUrl)
    const qrCodeUrl = selectionQrCodes.recommended
    const fallbackQrCodeUrl = selectionQrCodes.fallback

    // Update the pass record with the correct QR code URL
    await supabase
      .from('passes')
      .update({
        qr_code_url: qrCodeUrl
      })
      .eq('id', passRecord.id)

    console.log('✅ Google Wallet pass creation workflow completed successfully!');
    
    // Return success response with detailed workflow information
    return NextResponse.json({
      success: true,
      message: "Google Wallet pass created successfully",
      passId: passRecord?.id, // Include pass ID for analytics tracking
      // Detailed workflow breakdown for transparency
      workflow: {
        step1_class: { 
          id: classId, 
          status: classResult.created ? 'created' : 'existing',
          description: 'Pass class created or verified'
        },
        step2_object: { 
          id: objectId, 
          status: 'created',
          description: 'Unique pass object created for user'
        },
        step3_jwt: { 
          generated: true,
          description: 'Save link JWT token generated'
        },
        step4_database: { 
          stored: true,
          recordId: passRecord?.id,
          description: 'Pass details stored in database successfully'
        },
        step5_qr: { 
          url: qrCodeUrl,
          fallbackUrl: fallbackQrCodeUrl,
          shortUrl: selectionQrCodes.shortUrl,
          format: 'QR code pointing to wallet selection page',
          description: 'QR code redirects to page where users can choose Google Wallet or Apple Wallet'
        }
      },
      // Primary pass data
      passUrl: jwtResult.saveUrl,
      qrCodeUrl,
      fallbackQrCodeUrl,
      qrCodeInfo: {
        primary: qrCodeUrl,
        fallback: fallbackQrCodeUrl,
        shortUrl: selectionQrCodes.shortUrl,
        originalUrl: walletSelectionUrl,
        instructions: 'Scan the QR code to choose between Google Wallet and Apple Wallet.',
        format: 'Wallet selection page QR code',
        selectionPageUrl: walletSelectionUrl
      },
      passData,
      metadata,
      dbRecord: passRecord
    });

  } catch (error: any) {
    console.error('Pass creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create pass',
        workflow_step: 'unknown'
      }, 
      { status: 500 }
    );
  }
}

// Helper function to create or get existing class
async function createOrGetClass(walletClient: any, passType: string, classId: string, classPayload: any) {
  try {
    let classExists = false
    
    // Check if class already exists
    try {
      switch (passType) {
        case 'loyalty':
          await walletClient.loyaltyclass.get({ resourceId: classId })
          break
        case 'gift-card':
          await walletClient.giftcardclass.get({ resourceId: classId })
          break
        case 'offer':
          await walletClient.offerclass.get({ resourceId: classId })
          break
        case 'generic':
          await walletClient.genericclass.get({ resourceId: classId })
          break
      }
      console.log('✅ Class already exists:', classId)
      classExists = true

      // Refresh existing class so new logo/title/background changes apply to future objects
      const updateMask = Object.keys(classPayload || {})
        .filter(key => !['id', 'reviewStatus'].includes(key) && classPayload[key] !== undefined)
        .join(',');

      if (updateMask) {
        try {
          switch (passType) {
            case 'loyalty':
              await walletClient.loyaltyclass.patch({
                resourceId: classId,
                updateMask,
                requestBody: classPayload
              })
              break
            case 'gift-card':
              await walletClient.giftcardclass.patch({
                resourceId: classId,
                updateMask,
                requestBody: classPayload
              })
              break
            case 'offer':
              await walletClient.offerclass.patch({
                resourceId: classId,
                updateMask,
                requestBody: classPayload
              })
              break
            case 'generic':
              await walletClient.genericclass.patch({
                resourceId: classId,
                updateMask,
                requestBody: classPayload
              })
              break
          }
          console.log('ƒo. Existing class refreshed with latest branding:', { classId, updateMask })
        } catch (patchError: any) {
          console.warn('ƒ?O Class refresh failed (continuing with existing class):', {
            status: patchError.response?.status,
            message: patchError.response?.data?.error?.message || patchError.message,
            updateMask
          })
        }
      }
    } catch (getError: any) {
      if (getError.response?.status === 404) {
        // Class doesn't exist, create it
        console.log('Creating new class:', classId)
        try {
          switch (passType) {
            case 'loyalty':
              await walletClient.loyaltyclass.insert({ requestBody: classPayload })
              break
            case 'gift-card':
              await walletClient.giftcardclass.insert({ requestBody: classPayload })
              break
            case 'offer':
              await walletClient.offerclass.insert({ requestBody: classPayload })
              break
            case 'generic':
              await walletClient.genericclass.insert({ requestBody: classPayload })
              break
          }
          console.log('✅ New class created:', classId)
          
          // Wait for class to be processed by Google
          await new Promise(resolve => setTimeout(resolve, 2000))
          
        } catch (createError: any) {
          console.error('❌ Error creating class:', createError.response?.data)
          return {
            success: false,
            error: `Failed to create ${passType} class: ${createError.response?.data?.error?.message || createError.message}`,
            errorType: 'CLASS_CREATION_FAILED'
          }
        }
      } else {
        console.error('❌ Error checking class:', getError.message || getError)
        console.error('Error details:', {
          status: getError.response?.status,
          statusText: getError.response?.statusText,
          data: getError.response?.data,
          code: getError.code,
          message: getError.message
        })
        return {
          success: false,
          error: `Failed to verify ${passType} class: ${getError.message || 'Unknown authentication error'}`,
          errorType: 'CLASS_VERIFICATION_FAILED'
        }
      }
    }
    
    return { success: true, created: !classExists }
  } catch (error: any) {
    return {
      success: false,
      error: `Class operation failed: ${error.message}`,
      errorType: 'CLASS_OPERATION_FAILED'
    }
  }
}

// Helper function to create pass object
async function createPassObject(walletClient: any, passType: string, objectId: string, objectPayload: any) {
  try {
    let objectResponse
    
    switch (passType) {
      case 'loyalty':
        objectResponse = await walletClient.loyaltyobject.insert({
          requestBody: objectPayload
        })
        break
      case 'gift-card':
        objectResponse = await walletClient.giftcardobject.insert({
          requestBody: objectPayload
        })
        break
      case 'offer':
        objectResponse = await walletClient.offerobject.insert({
          requestBody: objectPayload
        })
        break
      case 'generic':
        objectResponse = await walletClient.genericobject.insert({
          requestBody: objectPayload
        })
        break
    }

    console.log('✅ Pass object created:', objectId)
    return { success: true, response: objectResponse?.data }
    
  } catch (error: any) {
    console.error('❌ Error creating object:', error.response?.data)
    
    // Handle specific "not approved" error
    if (error.response?.status === 404 && 
        error.response?.data?.error?.message?.includes('not approved')) {
      return {
        success: false,
        error: 'Pass class needs to be approved by Google Wallet. This is normal for new classes. Please try again in a few minutes.',
        errorType: 'CLASS_NOT_APPROVED'
      }
    }
    
    return {
      success: false,
      error: `Failed to create ${passType} object: ${error.response?.data?.error?.message || error.message}`,
      errorType: 'OBJECT_CREATION_FAILED'
    }
  }
}

// Helper function to generate JWT for Save link - following Google's official implementation
function generateSaveJWT(objectId: string, passType: string, classPayload: any, objectPayload: any) {
  const serviceAccount = getGoogleServiceAccount()
  
  // Determine the origin based on environment
  const origin = process.env.NODE_ENV === 'production' 
    ? (process.env.NEXTAUTH_URL || 'https://perklane.com').replace('https://', '').replace('http://', '')
    : 'localhost:3000'
  
  // Map pass types to Google Wallet API field names (camelCase, no hyphens)
  const passTypeMapping: Record<string, string> = {
    'generic': 'generic',
    'loyalty': 'loyalty', 
    'gift-card': 'giftCard',
    'offer': 'offer'
  }
  
  const googlePassType = passTypeMapping[passType] || passType
  
  // Follow Google's official JWT structure - include both class and object definitions
  const claims = {
    iss: serviceAccount.client_email,
    aud: 'google',
    origins: [origin],
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      // Include both class and object definitions in payload as per Google's example
      // Use proper camelCase field names for Google Wallet API
      [`${googlePassType}Classes`]: [classPayload],
      [`${googlePassType}Objects`]: [objectPayload]
    }
  }

  const jwtToken = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' })
  const saveUrl = `https://pay.google.com/gp/v/save/${jwtToken}`
  
  console.log(`🎫 Generated Save to Google Wallet JWT with full class/object definitions for ${passType} (${googlePassType})`)
  
  return { jwtToken, saveUrl }
}

// Helper function to shorten URLs using TinyURL
async function shortenUrl(longUrl: string): Promise<string> {
  try {
    console.log('🔗 Shortening URL:', longUrl.substring(0, 100) + '...');
    
    const tinyUrlResponse = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    
    if (!tinyUrlResponse.ok) {
      throw new Error(`TinyURL API responded with status: ${tinyUrlResponse.status}`);
    }
    
    const shortUrl = await tinyUrlResponse.text();
    
    // Validate that we got a proper TinyURL response
    if (shortUrl.startsWith('http') && shortUrl.includes('tinyurl.com')) {
      console.log('✅ URL shortened successfully:', shortUrl);
      return shortUrl;
    } else {
      throw new Error(`Invalid TinyURL response: ${shortUrl}`);
    }
  } catch (error) {
    console.warn('⚠️ URL shortening failed:', error);
    // Return original URL if shortening fails
    return longUrl;
  }
}

// Helper function to generate QR codes for Google Wallet
async function generateGoogleWalletQRCodes(jwtToken: string, saveUrl: string) {
  try {
    console.log('🔍 QR Code Generation Debug:');
    console.log('JWT Token length:', jwtToken.length);
    console.log('Save URL length:', saveUrl.length);
    console.log('JWT Token preview:', jwtToken.substring(0, 100) + '...');
    console.log('Save URL:', saveUrl);
    
    // Shorten the URL first to make QR codes more reliable
    const shortUrl = await shortenUrl(saveUrl);
    console.log('🎯 Using shortened URL for QR code:', shortUrl);
    console.log('📏 Shortened URL length:', shortUrl.length);
    
    // Generate QR codes with the shortened URL - much more reliable!
    const primaryQR = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shortUrl)}&format=png&ecc=M&margin=5`
    
    // Secondary QR code with Google Charts API
    const fallbackQR = `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(shortUrl)}&choe=UTF-8`
    
    console.log('✅ QR codes generated with shortened URL');
    console.log('Primary QR URL length:', primaryQR.length);
    console.log('Fallback QR URL length:', fallbackQR.length);
    
    return {
      primary: primaryQR,
      fallback: fallbackQR,
      recommended: primaryQR, // Use the primary one with shortened URL
      shortUrl: shortUrl, // Include the short URL for reference
      originalUrl: saveUrl // Keep original URL for fallback
    }
  } catch (error) {
    console.error('❌ QR code generation error:', error);
    // Fallback to simple QR with original URL if shortening fails completely
    const simpleQR = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(saveUrl)}&format=png&ecc=L&margin=5`
    return {
      primary: simpleQR,
      fallback: simpleQR,
      recommended: simpleQR,
      shortUrl: saveUrl,
      originalUrl: saveUrl
    }
  }
}

// Helper function to generate QR codes for wallet selection page
async function generateWalletSelectionQRCode(selectionUrl: string) {
  try {
    console.log('🔍 Wallet Selection QR Code Generation:');
    console.log('Selection URL:', selectionUrl);
    console.log('Selection URL length:', selectionUrl.length);
    
    // Generate QR codes pointing to the wallet selection page
    const primaryQR = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(selectionUrl)}&format=png&ecc=M&margin=5`
    
    // Secondary QR code with Google Charts API
    const fallbackQR = `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(selectionUrl)}&choe=UTF-8`
    
    console.log('✅ Wallet selection QR codes generated');
    
    return {
      primary: primaryQR,
      fallback: fallbackQR,
      recommended: primaryQR,
      shortUrl: selectionUrl,
      originalUrl: selectionUrl
    }
  } catch (error) {
    console.error('❌ Wallet selection QR code generation error:', error);
    // Fallback to simple QR
    const simpleQR = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(selectionUrl)}&format=png&ecc=L&margin=5`
    return {
      primary: simpleQR,
      fallback: simpleQR,
      recommended: simpleQR,
      shortUrl: selectionUrl,
      originalUrl: selectionUrl
    }
  }
}

// Helper function to format dates for Google Wallet
function formatDateForGoogleWallet(dateString: string): string {
  if (!dateString) return dateString;
  
  // If it's already in ISO 8601 format with time, return as is
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
    return dateString;
  }
  
  // If it's in YYYY-MM-DD format, add time component (end of day)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return `${dateString}T23:59:59Z`; // End of day in UTC
  }
  
  // Try to parse and format the date
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}`);
      // Return a default far future date instead of invalid string
      return new Date('2099-12-31T23:59:59Z').toISOString();
    }
    
    // Return in ISO 8601 format with time
    return date.toISOString();
  } catch (error) {
    console.warn(`Date parsing error for ${dateString}:`, error);
    // Return a default far future date on error
    return new Date('2099-12-31T23:59:59Z').toISOString();
  }
}

// Helper function to validate required pass data
function validatePassData(passType: string, passData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if passData exists
  if (!passData || typeof passData !== 'object') {
    errors.push('Pass data is required and must be an object');
    return { isValid: false, errors };
  }
  
  // Common validations - only require title
  if (!passData.title || typeof passData.title !== 'string' || passData.title.trim().length === 0) {
    errors.push('Pass title is required and cannot be empty');
  }
  
  // Validate pass type
  const validPassTypes = ['generic', 'loyalty', 'gift-card', 'offer'];
  if (!validPassTypes.includes(passType)) {
    errors.push(`Invalid pass type: ${passType}. Must be one of: ${validPassTypes.join(', ')}`);
  }
  
  // Type-specific validations (more lenient)
  switch (passType) {
    case 'loyalty':
      // Don't require member name - we'll use a default if not provided
      break;
      
    case 'gift-card':
      // Don't require balance - we'll use 0 if not provided, but warn
      if (passData.balance && isNaN(parseFloat(passData.balance))) {
        errors.push('Gift card balance must be a valid number if provided');
      }
      break;
      
    case 'offer':
      // Don't require offer code - we'll generate one if not provided
      if (!passData.offerCode && !passData.promoCode && !passData.couponCode) {
        console.warn('Offer code not provided, will generate one');
      }
      break;
      
    case 'generic':
      // Don't require description - we'll use a default if not provided
      if (!passData.description || passData.description.trim().length < 5) {
        console.warn('Generic pass description is short or missing, using default');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper functions for creating different pass types

/**
 * Creates a loyalty pass class with optional Smart Tap support
 * ENHANCED: Supports all new customization fields including colors, images, and program details
 * @param classId Unique class identifier
 * @param passData Pass configuration data with all customization options
 * @param smartTapConfig Optional Smart Tap configuration with merchantIds and redemptionValue
 */
function createLoyaltyClass(classId: string, passData: any, smartTapConfig?: any) {
  // Convert relative paths to full URLs
  const logoUrl = passData.logo?.startsWith('/') 
    ? `${process.env.NEXTAUTH_URL || 'https://perklane.com'}${passData.logo}`
    : passData.logo;
  
  // Convert background image to full URL
  const backgroundImageUrl = passData.backgroundImage?.startsWith('/')
    ? `${process.env.NEXTAUTH_URL || 'https://perklane.com'}${passData.backgroundImage}`
    : passData.backgroundImage;

  const classPayload: any = {
    id: classId,
    issuerName: passData.title || passData.programName,
    programName: passData.programName || passData.title,
    reviewStatus: 'UNDER_REVIEW',
    programLogo: logoUrl ? {
      sourceUri: {
        uri: logoUrl
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Program Logo'
        }
      }
    } : undefined,
    // Custom colors
    hexBackgroundColor: passData.backgroundColor || passData.brandColor || '#000000',
    // Background image support (displayed as hero image)
    heroImage: backgroundImageUrl ? {
      sourceUri: {
        uri: backgroundImageUrl
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Program Background'
        }
      }
    } : undefined,
    locations: [],
    textModulesData: [
      {
        header: 'Program Information',
        body: passData.description || 'Earn rewards with every purchase',
        id: 'program_info'
      }
    ],
    linksModuleData: passData.programWebsite ? {
      uris: [{
        uri: passData.programWebsite,
        description: 'Program Website',
        id: 'program_website'
      }]
    } : undefined,
    // General pass - one QR for all customers
    allowMultipleUsersPerObject: false
  }
  
  // Add customer service phone if provided
  if (passData.customerServicePhone) {
    if (!classPayload.textModulesData) classPayload.textModulesData = [];
    classPayload.textModulesData.push({
      header: 'Customer Service',
      body: passData.customerServicePhone,
      id: 'customer_service'
    });
  }

  // Add Smart Tap configuration if provided
  if (smartTapConfig?.merchantIds && smartTapConfig.merchantIds.length > 0) {
    classPayload.enableSmartTap = true;
    classPayload.smartTapRedemptionValue = smartTapConfig.redemptionValue || '1';
    classPayload.merchantIds = smartTapConfig.merchantIds;
  }

  return classPayload;
}

/**
 * Creates a loyalty pass object with comprehensive customization
 * ENHANCED: Supports general pass concept with tier system, points tracking, and rewards
 * @param objectId Unique object identifier
 * @param classId Reference to the loyalty class
 * @param passData Complete pass configuration including all customization fields
 */
function createLoyaltyObject(objectId: string, classId: string, passData: any) {
  // Build comprehensive text modules for loyalty program
  const textModules = [];
  
  // Tier information with custom color badge
  if (passData.tier) {
    textModules.push({
      header: 'Current Tier',
      body: (passData.tier || 'Bronze').toUpperCase(),
      id: 'current_tier'
    });
  }

  // Points for reward information
  if (passData.pointsForReward && passData.rewardDescription) {
    textModules.push({
      header: 'Reward Available',
      body: `Earn ${passData.pointsForReward} ${passData.pointsLabel || 'points'} for ${passData.rewardDescription}`,
      id: 'reward_info'
    });
  }

  // Tier progress information
  if (passData.nextTier && passData.pointsToNextTier) {
    const currentPoints = parseInt(passData.pointsBalance) || 0;
    const pointsNeeded = parseInt(passData.pointsToNextTier) || 0;
    const progress = pointsNeeded > 0 ? Math.round((currentPoints / (currentPoints + pointsNeeded)) * 100) : 0;
    
    textModules.push({
      header: 'Next Tier Progress',
      body: `${progress}% to ${passData.nextTier} tier. You need ${pointsNeeded} more ${passData.pointsLabel || 'points'} to reach the next level.`,
      id: 'tier_progress'
    });
  }

  // Issue date
  if (passData.issueDate || passData.memberSince) {
    const issueDate = new Date(passData.issueDate || passData.memberSince);
    textModules.push({
      header: 'Member Since',
      body: issueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      id: 'issue_date'
    });
  }

  // Nearest location information
  if (passData.nearestLocation) {
    let locationText = passData.nearestLocation;
    if (passData.distanceToNearest) {
      locationText += ` (${passData.distanceToNearest})`;
    }
    textModules.push({
      header: 'Nearest Store',
      body: locationText,
      id: 'nearest_location'
    });
  }

  // Program description
  if (passData.description) {
    textModules.push({
      header: 'About This Program',
      body: passData.description,
      id: 'program_description'
    });
  }

  // Contact information
  if (passData.customerServicePhone) {
    textModules.push({
      header: 'Customer Service',
      body: passData.customerServicePhone,
      id: 'customer_service'
    });
  }

  const loyaltyObject: any = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    loyaltyPoints: {
      label: passData.pointsLabel || 'Points',
      balance: {
        int: parseInt(passData.pointsBalance) || 0
      }
    },
    // General pass - no specific account name required
    accountName: passData.programName || passData.title || 'Valued Member',
    accountId: `MEMBER${Date.now().toString().slice(-8)}`,
    textModulesData: textModules
  };

  // Always include a barcode so the pass renders the QR view (fallback to objectId)
  loyaltyObject.barcode = {
    type: passData.barcodeType || 'QR_CODE',
    value: passData.barcodeValue || objectId,
    alternateText: passData.barcodeAltText || passData.title || objectId.split('.').pop() || objectId
  };

  // Add validity period if provided
  if (passData.expirationDate || passData.membershipExpiry) {
    loyaltyObject.validTimeInterval = {
      end: {
        date: passData.expirationDate || passData.membershipExpiry
      }
    };
    
    // Add start date if issue date is provided
    if (passData.issueDate) {
      loyaltyObject.validTimeInterval.start = {
        date: passData.issueDate
      };
    }
  }

  // Add secondary points for tier tracking if next tier is configured
  if (passData.nextTier && passData.pointsToNextTier) {
    loyaltyObject.secondaryLoyaltyPoints = {
      label: `Progress to ${passData.nextTier}`,
      balance: {
        int: parseInt(passData.pointsBalance) || 0
      }
    };
  }

  return loyaltyObject;
}

/**
 * Creates a gift card pass class with optional Smart Tap support
 * @param classId Unique class identifier
 * @param passData Pass configuration data
 * @param smartTapConfig Optional Smart Tap configuration with merchantIds
 */
function createGiftCardClass(classId: string, passData: any, smartTapConfig?: any) {
  // Convert relative paths to full URLs
  const logoUrl = passData.logo?.startsWith('/') 
    ? `${process.env.NEXTAUTH_URL || 'https://perklane.com'}${passData.logo}`
    : passData.logo;

  const classPayload: any = {
    id: classId,
    issuerName: passData.title || passData.programName,
    merchantName: passData.title,
    reviewStatus: 'UNDER_REVIEW',
    merchantLogo: logoUrl ? {
      sourceUri: {
        uri: logoUrl
      }
    } : undefined,
    hexBackgroundColor: passData.backgroundColor || '#000000'
  }

  // Add Smart Tap configuration if provided
  if (smartTapConfig?.merchantIds && smartTapConfig.merchantIds.length > 0) {
    classPayload.enableSmartTap = true;
    classPayload.merchantIds = smartTapConfig.merchantIds;
  }

  return classPayload;
}

function createGiftCardObject(objectId: string, classId: string, passData: any) {
  // Build comprehensive text modules for gift card
  const textModules = [];

  // Add gift card details
  if (passData.purchasedBy || passData.giftFrom) {
    textModules.push({
      header: 'Gift From',
      body: passData.purchasedBy || passData.giftFrom || 'A thoughtful friend',
      id: 'gift_from'
    });
  }

  if (passData.recipientName || passData.giftTo) {
    textModules.push({
      header: 'Gift To',
      body: passData.recipientName || passData.giftTo || 'You',
      id: 'gift_to'
    });
  }

  // Add usage instructions
  const usageInstructions = passData.usageInstructions || 
    'Present this gift card at checkout. Can be used for online and in-store purchases. ' +
    'Remaining balance will be preserved for future use.';
  
  textModules.push({
    header: 'How to Use',
    body: usageInstructions,
    id: 'usage_instructions'
  });

  // Add store locations
  if (passData.storeLocations || passData.validLocations) {
    textModules.push({
      header: 'Valid At',
      body: passData.storeLocations || passData.validLocations || 'All participating locations and online',
      id: 'valid_locations'
    });
  }

  // Add terms and conditions
  const terms = passData.terms || passData.termsConditions || 
    'Gift card cannot be redeemed for cash. No fees apply. ' +
    'Treat as cash - not responsible if lost or stolen. ' +
    'Check balance online or at any location.';
  
  textModules.push({
    header: 'Terms & Conditions',
    body: terms,
    id: 'terms'
  });

  // Add balance check information
  if (passData.balanceCheckUrl || passData.customerService) {
    textModules.push({
      header: 'Check Balance',
      body: passData.balanceCheckInfo || 
            `Visit ${passData.balanceCheckUrl || 'our website'} or call ${passData.customerService || 'customer service'} to check your balance`,
      id: 'balance_check'
    });
  }

  // Add purchase information
  if (passData.purchaseDate) {
    textModules.push({
      header: 'Purchased On',
      body: passData.purchaseDate,
      id: 'purchase_date'
    });
  }

  // Add special message
  if (passData.personalMessage || passData.giftMessage) {
    textModules.push({
      header: 'Personal Message',
      body: passData.personalMessage || passData.giftMessage,
      id: 'personal_message'
    });
  }

  const giftCardObject: any = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    cardNumber: passData.cardNumber || `GC${Date.now().toString().slice(-8)}`,
    balance: {
      micros: String((parseFloat(passData.balance) || 25.0) * 1000000),
      currencyCode: passData.currencyCode || 'USD'
    },
    pin: passData.pin || undefined,
    textModulesData: textModules
  };

  // Add expiration if provided
  if (passData.expirationDate || passData.validUntil) {
    giftCardObject.eventDateTime = {
      date: passData.expirationDate || passData.validUntil
    };
  }

  // Add barcode if provided
  if (passData.barcodeValue || passData.cardNumber) {
    giftCardObject.barcode = {
      type: passData.barcodeType || 'CODE_128',
      value: passData.barcodeValue || passData.cardNumber,
      alternateText: passData.cardNumber || 'Gift Card Number'
    };
  }

  // Add validity period
  if (passData.validFrom || passData.expirationDate) {
    giftCardObject.validTimeInterval = {};
    
    if (passData.validFrom) {
      giftCardObject.validTimeInterval.start = {
        date: passData.validFrom
      };
    }
    
    if (passData.expirationDate || passData.validUntil) {
      giftCardObject.validTimeInterval.end = {
        date: passData.expirationDate || passData.validUntil
      };
    }
  }

  return giftCardObject;
}

/**
 * Creates an offer pass class with optional Smart Tap support
 * @param classId Unique class identifier
 * @param passData Pass configuration data
 * @param smartTapConfig Optional Smart Tap configuration with merchantIds and redemptionIssuers
 */
function createOfferClass(classId: string, passData: any, smartTapConfig?: any) {
  // Convert relative paths to full URLs
  const logoUrl = passData.logo?.startsWith('/') 
    ? `${process.env.NEXTAUTH_URL || 'https://perklane.com'}${passData.logo}`
    : passData.logo;

  const classPayload: any = {
    id: classId,
    issuerName: passData.title || passData.programName,
    title: passData.title,
    provider: passData.title,
    reviewStatus: 'UNDER_REVIEW',
    redemptionChannel: 'BOTH',
    titleImage: logoUrl ? {
      sourceUri: {
        uri: logoUrl
      }
    } : undefined,
    hexBackgroundColor: passData.brandColor || '#000000',
    details: passData.redemptionInstructions
  }

  // Add Smart Tap configuration if provided
  if (smartTapConfig?.merchantIds && smartTapConfig.merchantIds.length > 0) {
    classPayload.enableSmartTap = true;
    classPayload.merchantIds = smartTapConfig.merchantIds;
    classPayload.redemptionIssuers = smartTapConfig.redemptionIssuers || [];
  }

  return classPayload;
}



function createOfferObject(objectId: string, classId: string, passData: any) {
  // Build comprehensive text modules for offer
  const textModules = [];

  // Add offer code prominently
  const offerCode = passData.offerCode || passData.promoCode || passData.couponCode || 
                   `SAVE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  if (offerCode !== (passData.offerCode || passData.promoCode || passData.couponCode)) {
    console.log('Generated offer code:', offerCode);
  }
  
  textModules.push({
    header: 'Offer Code',
    body: offerCode.toUpperCase(),
    id: 'offer_code'
  });

  // Add discount details
  if (passData.discountAmount || passData.discountPercent || passData.savings) {
    let discountInfo = '';
    if (passData.discountPercent) {
      discountInfo = `${passData.discountPercent}% OFF`;
    } else if (passData.discountAmount) {
      discountInfo = `$${passData.discountAmount} OFF`;
    } else {
      discountInfo = passData.savings;
    }
    
    textModules.push({
      header: 'Discount',
      body: discountInfo,
      id: 'discount_info'
    });
  }

  // Add minimum purchase requirement
  if (passData.minimumPurchase || passData.minSpend) {
    textModules.push({
      header: 'Minimum Purchase',
      body: `$${passData.minimumPurchase || passData.minSpend} minimum required`,
      id: 'minimum_purchase'
    });
  }

  // Add redemption instructions
  const redemptionInstructions = passData.redemptionInstructions || passData.howToUse ||
    'Present this offer at checkout or enter the offer code online. ' +
    'Cannot be combined with other offers. Valid for one-time use only.';
  
  textModules.push({
    header: 'How to Redeem',
    body: redemptionInstructions,
    id: 'redemption_instructions'
  });

  // Add valid locations
  if (passData.validLocations || passData.storeLocations || passData.applicableStores) {
    textModules.push({
      header: 'Valid At',
      body: passData.validLocations || passData.storeLocations || passData.applicableStores || 
            'All participating locations and online',
      id: 'valid_locations'
    });
  }

  // Add product restrictions
  if (passData.productRestrictions || passData.excludedItems || passData.applicableProducts) {
    textModules.push({
      header: 'Product Details',
      body: passData.productRestrictions || 
            (passData.excludedItems ? `Excludes: ${passData.excludedItems}` : '') ||
            (passData.applicableProducts ? `Valid on: ${passData.applicableProducts}` : 'See terms for product eligibility'),
      id: 'product_restrictions'
    });
  }

  // Add expiry information
  if (passData.expiryDate || passData.validUntil) {
    textModules.push({
      header: 'Expires',
      body: passData.expiryDate || passData.validUntil,
      id: 'expiry_date'
    });
  }

  // Add terms and conditions
  const terms = passData.terms || passData.termsConditions ||
    'Offer valid for one-time use. Cannot be combined with other promotions. ' +
    'No cash value. Void if copied, transferred, or modified. ' +
    'Subject to availability and merchant terms.';
  
  textModules.push({
    header: 'Terms & Conditions',
    body: terms,
    id: 'terms'
  });

  // Add contact information
  if (passData.customerService || passData.supportContact) {
    textModules.push({
      header: 'Questions?',
      body: `Contact us: ${passData.customerService || passData.supportContact}`,
      id: 'customer_service'
    });
  }

  const offerObject: any = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    textModulesData: textModules
  };

  // Add validity period
  if (passData.validFrom || passData.expiryDate || passData.validUntil) {
    offerObject.validTimeInterval = {};
    
    if (passData.validFrom) {
      offerObject.validTimeInterval.start = {
        date: formatDateForGoogleWallet(passData.validFrom)
      };
    }
    
    if (passData.expiryDate || passData.validUntil) {
      offerObject.validTimeInterval.end = {
        date: formatDateForGoogleWallet(passData.expiryDate || passData.validUntil)
      };
    }
  }

  // Add barcode if provided
  if (passData.barcodeValue || passData.offerCode) {
    offerObject.barcode = {
      type: passData.barcodeType || 'CODE_128',
      value: passData.barcodeValue || passData.offerCode || passData.promoCode,
      alternateText: passData.offerCode || passData.promoCode || 'Offer Code'
    };
  }

  // Add usage limit information
  if (passData.usageLimit || passData.singleUse) {
    offerObject.usageRestriction = passData.singleUse ? 'ONE_TIME_USE' : 'MULTIPLE_USE';
  }

  return offerObject;
}

function createGenericClass(classId: string, passData: any) {
  // Convert relative paths to full URLs
  const logoUrl = passData.logo?.startsWith('/') 
    ? `${process.env.NEXTAUTH_URL || 'https://perklane.com'}${passData.logo}`
    : passData.logo;

  return {
    id: classId,
    issuerName: passData.title || passData.programName,
    reviewStatus: 'UNDER_REVIEW',
    logo: logoUrl ? {
      sourceUri: {
        uri: logoUrl
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Pass logo'
        }
      }
    } : undefined,
    hexBackgroundColor: passData.brandColor || '#4285F4',
    localizedIssuerName: {
      defaultValue: {
        language: 'en-US',
        value: 'Perklane'
      }
    },
    multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
    // Add more comprehensive class-level information
    textModulesData: [
      {
        header: 'About',
        body: passData.description || 'Digital pass created with Perklane',
        id: 'about'
      },
      {
        header: 'Program Details',
        body: passData.programDetails || 'Exclusive access and benefits for members',
        id: 'program_details'
      }
    ],
    // Add class-level links if provided
    linksModuleData: passData.website || passData.supportUrl ? {
      uris: [
        ...(passData.website ? [{
          uri: passData.website,
          description: 'Visit Website',
          id: 'website'
        }] : []),
        ...(passData.supportUrl ? [{
          uri: passData.supportUrl,
          description: 'Support',
          id: 'support'
        }] : [])
      ]
    } : undefined,
    // Add security features
    securityAnimation: {
      animationType: 'FOIL_SHIMMER'
    }
  }
}

function createGenericObject(objectId: string, classId: string, passData: any) {
  // Generate rich text modules with comprehensive information
  const textModules = [
    {
      header: 'Description',
      body: passData.description || 'Digital pass created with Perklane - Your gateway to exclusive access and benefits.',
      id: 'description'
    },
    {
      header: 'Pass ID',
      body: objectId.split('.').pop() || objectId,
      id: 'pass_id'
    }
  ];

  // Add event details if provided
  if (passData.eventDate || passData.eventTime) {
    const eventDetails = [];
    if (passData.eventDate) eventDetails.push(`Date: ${passData.eventDate}`);
    if (passData.eventTime) eventDetails.push(`Time: ${passData.eventTime}`);
    if (passData.venue) eventDetails.push(`Venue: ${passData.venue}`);
    
    textModules.push({
      header: 'Event Details',
      body: eventDetails.join('\n'),
      id: 'event_details'
    });
  }

  // Add location information if provided
  if (passData.location || passData.address) {
    textModules.push({
      header: 'Location',
      body: passData.address || passData.location || 'Location details will be provided',
      id: 'location'
    });
  }

  // Add validity/expiry information
  if (passData.validUntil || passData.expiryDate) {
    textModules.push({
      header: 'Valid Until',
      body: passData.validUntil || passData.expiryDate,
      id: 'validity'
    });
  }

  // Add instructions or notes
  if (passData.instructions || passData.notes) {
    textModules.push({
      header: 'Instructions',
      body: passData.instructions || passData.notes,
      id: 'instructions'
    });
  }

  // Add contact information if provided
  if (passData.contactInfo || passData.phone || passData.email) {
    const contactDetails = [];
    if (passData.phone) contactDetails.push(`Phone: ${passData.phone}`);
    if (passData.email) contactDetails.push(`Email: ${passData.email}`);
    if (passData.contactInfo && !passData.phone && !passData.email) {
      contactDetails.push(passData.contactInfo);
    }
    
    if (contactDetails.length > 0) {
      textModules.push({
        header: 'Contact',
        body: contactDetails.join('\n'),
        id: 'contact'
      });
    }
  }

  // Add terms and conditions
  if (passData.terms || passData.termsAndConditions) {
    textModules.push({
      header: 'Terms & Conditions',
      body: passData.terms || passData.termsAndConditions,
      id: 'terms'
    });
  }

  const passObject: any = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    cardTitle: {
      defaultValue: {
        language: 'en-US',
        value: passData.title || 'Digital Pass'
      }
    },
    header: {
      defaultValue: {
        language: 'en-US',
        value: passData.title || 'Digital Pass'
      }
    },
    subheader: passData.subtitle || passData.description ? {
      defaultValue: {
        language: 'en-US',
        value: passData.subtitle || passData.description?.substring(0, 100) || 'Exclusive Access'
      }
    } : undefined,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    // Add heroImage for better visual appeal (following Google's example)
    heroImage: passData.heroImage || passData.logo ? {
      sourceUri: {
        uri: (passData.heroImage || passData.logo)?.startsWith('/') 
          ? `${process.env.NEXTAUTH_URL || 'https://perklane.com'}${passData.heroImage || passData.logo}`
          : (passData.heroImage || passData.logo)
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Pass hero image'
        }
      }
    } : undefined,
    logo: passData.logo ? {
      sourceUri: {
        uri: passData.logo?.startsWith('/') 
          ? `${process.env.NEXTAUTH_URL || 'https://perklane.com'}${passData.logo}`
          : passData.logo
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Pass logo'
        }
      }
    } : undefined,
    hexBackgroundColor: passData.brandColor || '#4285F4',
    textModulesData: textModules,
    linksModuleData: {
      uris: [
        ...(passData.website ? [{
          uri: passData.website,
          description: 'Learn More',
          id: 'website_link'
        }] : []),
        ...(passData.supportUrl ? [{
          uri: passData.supportUrl,
          description: 'Support',
          id: 'support_link'
        }] : []),
        {
          uri: 'https://perklane.com',
          description: 'Created with Perklane',
          id: 'perklane_link'
        }
      ]
    },
    // Enhanced barcode following Google's example
    barcode: {
      type: 'QR_CODE',
      value: passData.barcodeValue || objectId,
      alternateText: passData.barcodeAltText || passData.title || objectId.split('.').pop() || objectId
    }
  };

  // Add validity time interval if dates are provided
  if (passData.validFrom || passData.validUntil || passData.eventDate) {
    passObject.validTimeInterval = {};
    
    if (passData.validFrom) {
      passObject.validTimeInterval.start = {
        date: passData.validFrom
      };
    }
    
    if (passData.validUntil) {
      passObject.validTimeInterval.end = {
        date: passData.validUntil
      };
    } else if (passData.eventDate) {
      // If no explicit end date, use event date as validity end
      passObject.validTimeInterval.end = {
        date: passData.eventDate
      };
    }
  }

  // Add location details if provided
  if (passData.latitude && passData.longitude) {
    passObject.locations = [{
      latitude: parseFloat(passData.latitude),
      longitude: parseFloat(passData.longitude)
    }];
  }

  return passObject;
}
