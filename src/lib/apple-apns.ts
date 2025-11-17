import http2 from 'http2'
import fs from 'fs'
import jwt from 'jsonwebtoken'

/**
 * Send an APNS push to a device token to notify Wallet to update a pass.
 * Uses token-based authentication (preferred). Environment variables:
 * - APPLE_APNS_KEY_ID -> Key ID from Apple developer account
 * - APPLE_TEAM_ID -> Team ID
 * - APPLE_APNS_KEY -> Base64 or file path to the .p8 key file (private key for JWT)
 * - APPLE_BUNDLE_ID -> The pass's bundle identifier (passTypeId may be used)
 *
 * This helper sends a background push (pushType 'background') which tells Wallet
 * to fetch the latest pass from the web service.
 */

function loadKey(keyData?: string) {
  if (!keyData) return null
  if (keyData.includes('-----BEGIN')) return keyData
  // File path
  if (keyData.includes('\\') || keyData.includes('/')) {
    if (fs.existsSync(keyData)) return fs.readFileSync(keyData, 'utf8')
  }
  // Assume base64
  try {
    return Buffer.from(keyData, 'base64').toString('utf8')
  } catch (e) {
    return null
  }
}

export async function sendApnsPush(
  serialNumber: string,
  deviceToken: string,
  options?: { pushType?: 'background' | 'voip' | 'alert' }
) {
  const pushType = options?.pushType || 'background'

  const keyId = process.env.APPLE_APNS_KEY_ID
  const teamId = process.env.APPLE_TEAM_ID
  const bundleId = process.env.APPLE_BUNDLE_ID || process.env.APPLE_PASS_TYPE_ID
  const rawKey = process.env.APPLE_APNS_KEY || process.env.APPLE_PASS_PRIVATE_KEY

  if (!deviceToken) return { success: false, error: 'No device token' }

  // Prefer token-based authentication with .p8 key
  const key = loadKey(rawKey)
  if (key && keyId && teamId && bundleId) {
    try {
      const now = Math.floor(Date.now() / 1000)
      const token = jwt.sign({}, key, {
        algorithm: 'ES256',
        header: { alg: 'ES256', kid: keyId },
        issuer: teamId,
        expiresIn: '1h'
      })

      const client = http2.connect('https://api.push.apple.com:443')

      return await new Promise((resolve) => {
        const path = `/3/device/${deviceToken}`
        const request = client.request({
          ':method': 'POST',
          ':path': path,
          'apns-topic': bundleId,
          'apns-push-type': pushType,
          authorization: `bearer ${token}`
        })

        const payload = JSON.stringify({
          aps: { 'content-available': 1 },
          'pkpass': { serialNumber }
        })

        request.setEncoding('utf8')
        let data = ''
        request.on('data', (chunk) => (data += chunk))
        request.on('end', () => {
          client.close()
          resolve({ success: true, status: 200, body: data })
        })
        request.on('error', (err) => {
          client.close()
          resolve({ success: false, error: err })
        })

        request.write(payload)
        request.end()
      })
    } catch (err: any) {
      console.error('APNS token auth error:', err)
      return { success: false, error: err.message }
    }
  }

  // If token-based auth not available, we cannot reliably send APNS without
  // the proper p12 cert and connection. Return a clear error so caller can fallback.
  return { success: false, error: 'APNS key or configuration missing' }
}

export default { sendApnsPush }
