import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    // Check if request has body content
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ 
        error: 'Content-Type must be application/json' 
      }, { status: 400 })
    }

    // Check if body exists and has content
    const rawBody = await request.text()
    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ 
        error: 'Request body is empty' 
      }, { status: 400 })
    }

    // Parse JSON with better error handling
    let body
    try {
      body = JSON.parse(rawBody)
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      console.error('Raw body received:', rawBody.substring(0, 1000)) // Log first 1000 chars
      console.error('Request headers:', Object.fromEntries(request.headers.entries()))
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: 'Request body is not valid JSON format'
      }, { status: 400 })
    }

    // Validate body is an object
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: 'Request body must be a JSON object'
      }, { status: 400 })
    }

    const { 
      passId, 
      eventType, 
      customerEmail, 
      customerName, 
      deviceInfo, 
      locationInfo,
      metadata 
    } = body

    // Validate required fields
    if (!passId || !eventType) {
      return NextResponse.json({ 
        error: 'Missing required fields: passId and eventType' 
      }, { status: 400 })
    }

    // Validate event type
    const validEventTypes = ['view', 'download', 'add_to_wallet', 'scan']
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ 
        error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Get request info
    const userAgent = request.headers.get('user-agent') || ''
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'
    const referrer = request.headers.get('referer') || ''

    // Verify pass exists
    const { data: pass, error: passError } = await supabase
      .from('passes')
      .select('id, title')
      .eq('id', passId)
      .single()

    if (passError || !pass) {
      return NextResponse.json({ 
        error: 'Pass not found' 
      }, { status: 404 })
    }

    // Insert analytics event
    const { data: analyticsEvent, error: analyticsError } = await supabase
      .from('pass_analytics')
      .insert({
        pass_id: passId,
        event_type: eventType,
        customer_email: customerEmail,
        customer_name: customerName,
        device_info: deviceInfo,
        location_info: locationInfo,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer,
        metadata: metadata
      })
      .select()
      .single()

    if (analyticsError) {
      // If analytics table doesn't exist yet, return success but with a note
      if (analyticsError.code === '42P01') {
        return NextResponse.json({
          success: true,
          message: 'Event received but analytics tracking not yet set up',
          eventType,
          passId
        })
      }
      
      console.error('Analytics insertion error:', analyticsError)
      return NextResponse.json({ 
        error: 'Failed to track event' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      eventId: analyticsEvent.id,
      eventType,
      passId,
      timestamp: analyticsEvent.created_at
    })

  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ 
      error: 'Failed to track event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to retrieve recent events for a pass (for debugging)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const passId = searchParams.get('passId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!passId) {
      return NextResponse.json({ 
        error: 'passId parameter required' 
      }, { status: 400 })
    }

    // Get recent events
    const { data: events, error } = await supabase
      .from('pass_analytics')
      .select('*')
      .eq('pass_id', passId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch events' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      events: events || [],
      passId,
      count: events?.length || 0
    })

  } catch (error) {
    console.error('Error in GET track:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}