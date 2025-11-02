import { NextResponse } from 'next/server'
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
 * Public API endpoint to fetch pass information
 * Used by the wallet selection page when users scan QR codes
 * 
 * GET /api/passes/[passId]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ passId: string }> }
) {
  try {
    const { passId } = await params

    if (!passId) {
      return NextResponse.json(
        { error: 'Pass ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching pass with ID:', passId)
    // Fetch pass from database - no authentication required for public QR scanning
    const { data: pass, error: fetchError } = await supabase
      .from('passes')
      .select(`
        id, 
        title, 
        pass_type, 
        pass_url, 
        pass_data, 
        status,
        class_id, 
        user_email
      `)
      .eq('id', passId)
      .single()

    if (fetchError || !pass) {
      console.error('Error fetching pass:', fetchError)
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      )
    }

    // Check if pass is active
    if (pass.status !== 'active') {
      return NextResponse.json(
        { error: 'This pass is no longer active' },
        { status: 410 }
      )
    }
    
    // We'll use the passId itself as the programId, and use the user_email as the business identifier
    const programId = passId;
    const userEmail = pass.user_email;

    // Return pass information (without sensitive user data)
    return NextResponse.json({
      id: pass.id,
      title: pass.title,
      pass_type: pass.pass_type,
      pass_url: pass.pass_url,
      business_email: userEmail,  // Use email instead of business_id
      program_id: programId,      // Use passId as program_id
      pass_data: {
        title: pass.pass_data?.title || pass.title,
        description: pass.pass_data?.description,
        brandColor: pass.pass_data?.brandColor,
        logo: pass.pass_data?.logo,
      }
    })

  } catch (error: any) {
    console.error('Error in pass fetch API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
