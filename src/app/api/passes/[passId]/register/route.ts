import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest, { params }: { params: Promise<{ passId: string }> }) {
  try {
    const { passId } = await params
    const session = await getServerSession(authOptions)

    // Expect the customerProgramId and wallet type in body
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { customerProgramId, wallet, deviceToken } = body

    if (!passId || !customerProgramId || !wallet) {
      return NextResponse.json({ success: false, error: 'passId, customerProgramId and wallet are required' }, { status: 400 })
    }

    // Fetch pass
    const { data: pass, error: passErr } = await supabase
      .from('passes')
      .select('*')
      .eq('id', passId)
      .maybeSingle()

    if (passErr) {
      console.error('Error fetching pass for register:', passErr)
      return NextResponse.json({ success: false, error: 'Failed to fetch pass' }, { status: 500 })
    }

    // Prepare record fields
    const record: any = {
      pass_id: passId,
      customer_program_id: customerProgramId,
      wallet_type: wallet,
      created_at: new Date().toISOString()
    }

    if (wallet === 'google') {
      record.google_object_id = pass?.object_id || pass?.pass_data?.objectId || null
    }

    if (wallet === 'apple') {
      // Use pass.object_id as serial for apple pkpass if available
      record.apple_serial_number = pass?.object_id || pass?.pass_data?.serialNumber || null
      if (deviceToken) record.apple_device_token = deviceToken
    }

    // Upsert to avoid duplicates
    const { data: upserted, error: upsertErr } = await supabase
      .from('pass_customers')
      .upsert(record)
      .select()
      .single()

    if (upsertErr) {
      console.error('Failed to register pass customer:', upsertErr)
      return NextResponse.json({ success: false, error: 'Failed to register pass' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: upserted })
  } catch (error: any) {
    console.error('Pass register error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
