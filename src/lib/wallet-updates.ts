import { google } from 'googleapis'
import { getGoogleServiceAccount } from './google-service-account'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAppleWalletPass } from './apple-wallet-service'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * Update Google Wallet object (loyalty/giftcard/offer/generic)
 * objectId must be the full resource id used when creating the object
 */
export async function updateGoogleWalletObject(objectId: string, patchBody: any) {
  try {
    const serviceAccount = getGoogleServiceAccount()
    const auth = new (require('google-auth-library').GoogleAuth)({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
    })
    const walletClient = google.walletobjects({ version: 'v1', auth })

    // Determine resource type from objectId (contains issuerId.passType_object_...)
    // We'll attempt common object endpoints - loyaltyobject, giftcardobject, offerobject, genericobject
  const endpoints = ['loyaltyobject', 'giftcardobject', 'offerobject', 'genericobject']
    for (const ep of endpoints) {
      try {
        // The patch method path is like walletobjects.loyaltyobject.patch({resourceId: objectId, requestBody: patchBody})
        if ((walletClient as any)[ep] && (walletClient as any)[ep].patch) {
          const res = await (walletClient as any)[ep].patch({ resourceId: objectId, requestBody: patchBody })
          return { success: true, result: res.data }
        }
      } catch (err) {
        // Ignore 404s / not found for this type and try next
        continue
      }
    }

    return { success: false, error: 'Object type not found or patch failed' }
  } catch (error: any) {
    console.error('Google Wallet update error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update Apple Wallet pass: regenerate a new .pkpass with updated passData
 * and return the buffer. Caller should store/send the new pass where needed.
 */
export async function regenerateApplePass(passRecord: any) {
  try {
    // passRecord should include pass_data and serialNumber/object_id
    const passData = passRecord.pass_data || {}
    const serialNumber = passRecord.object_id || passRecord.pass_data?.serialNumber || passRecord.id
    const buffer = await createAppleWalletPass({ ...passData, serialNumber })

    // Upload to Supabase Storage (bucket: pass-images) and update pass record
    try {
      const fileName = `passes/${passRecord.id || serialNumber}/pass-${serialNumber}.pkpass`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('pass-images')
        .upload(fileName, buffer, { contentType: 'application/vnd.apple.pkpass', upsert: true })

      if (uploadErr) {
        console.warn('Failed to upload pkpass to storage:', uploadErr)
      } else {
        // Get public URL for the uploaded file
        try {
          const { data: publicData } = await supabase.storage.from('pass-images').getPublicUrl(uploadData.path)
          const publicUrl = publicData?.publicUrl || null
          if (publicUrl) {
            await supabase
              .from('passes')
              .update({ apple_pass_url: publicUrl, updated_at: new Date().toISOString() })
              .eq('id', passRecord.id)
          }
        } catch (getUrlErr) {
          console.warn('Failed to get public URL for pkpass:', getUrlErr)
        }
      }
    } catch (upErr) {
      console.warn('Error uploading/regenerating apple pass:', upErr)
    }

    // Return the buffer along with serialNumber and any public URL we were able to generate
    return { success: true, buffer, serialNumber }
  } catch (error: any) {
    console.error('Apple pass regeneration error:', error)
    return { success: false, error: error.message }
  }
}
