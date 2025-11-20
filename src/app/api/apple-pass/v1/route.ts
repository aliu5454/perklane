import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Apple Wallet Web Service (simplified)
 * Endpoints implemented:
 * - POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 * - DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 *
 * This route is mounted at /api/apple-pass/v1
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    // path after /api/apple-pass/v1
    const rel = url.pathname.split('/api/apple-pass/v1')[1] || ''

    // Registration endpoint pattern
    // /devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
    const regMatch = rel.match(/\/devices\/([^/]+)\/registrations\/([^/]+)\/([^/]+)$/)
    if (regMatch) {
      const deviceLibraryIdentifier = decodeURIComponent(regMatch[1])
      const passTypeIdentifier = decodeURIComponent(regMatch[2])
      const serialNumber = decodeURIComponent(regMatch[3])

      // Verify authentication token header
      const authHeader = req.headers.get('Authorization') || ''
      const token = authHeader.replace(/^ApplePass\s*/i, '') || authHeader
      if (!process.env.APPLE_PASS_AUTH_TOKEN || token !== process.env.APPLE_PASS_AUTH_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await req.json()
      // body should contain device token
      const deviceToken = body?.pushToken || body?.deviceLibraryIdentifier || body?.deviceToken

      // Look up pass by passTypeIdentifier + serialNumber
      const { data: pass } = await supabase
        .from('passes')
        .select('*')
        .eq('object_id', serialNumber)
        .maybeSingle()

      // Persist registration to pass_customers (upsert)
      const record: any = {
        pass_id: pass?.id || null,
        apple_serial_number: serialNumber,
        apple_device_token: deviceToken,
        device_library_id: deviceLibraryIdentifier,
        wallet_type: 'apple',
        created_at: new Date().toISOString()
      }

      await supabase.from('pass_customers').upsert(record)

      return NextResponse.json({}, { status: 201 })
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  } catch (err: any) {
    console.error('Apple pass web service POST error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const rel = url.pathname.split('/api/apple-pass/v1')[1] || ''
    const regMatch = rel.match(/\/devices\/([^/]+)\/registrations\/([^/]+)\/([^/]+)$/)
    if (regMatch) {
      const deviceLibraryIdentifier = decodeURIComponent(regMatch[1])
      const passTypeIdentifier = decodeURIComponent(regMatch[2])
      const serialNumber = decodeURIComponent(regMatch[3])

      const authHeader = req.headers.get('Authorization') || ''
      const token = authHeader.replace(/^ApplePass\s*/i, '') || authHeader
      if (!process.env.APPLE_PASS_AUTH_TOKEN || token !== process.env.APPLE_PASS_AUTH_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Remove registration(s) by deviceLibraryIdentifier + serialNumber
      await supabase
        .from('pass_customers')
        .delete()
        .eq('device_library_id', deviceLibraryIdentifier)
        .eq('apple_serial_number', serialNumber)

      return NextResponse.json({}, { status: 200 })
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  } catch (err: any) {
    console.error('Apple pass web service DELETE error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
