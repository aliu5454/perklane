import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

// GET /api/passes/[id] - Get a specific pass
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabaseClient = supabase
    const { data: pass, error } = await supabaseClient
      .from('passes')
      .select('*')
      .eq('id', id)
      .eq('user_email', session.user.email)
      .single()

    if (error) {
      console.error('Error fetching pass:', error)
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }

    return NextResponse.json({ pass })
  } catch (error) {
    console.error('Error in GET pass:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/passes/[id] - Update a specific pass
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, pass_data } = body

    if (!title || !pass_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { id } = await params
    const supabaseClient = supabase
    
    // First verify the pass exists and belongs to the user
    const { data: existingPass, error: fetchError } = await supabaseClient
      .from('passes')
      .select('*')
      .eq('id', id)
      .eq('user_email', session.user.email)
      .single()

    if (fetchError || !existingPass) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }

    // Update the pass
    const { data: updatedPass, error: updateError } = await supabaseClient
      .from('passes')
      .update({
        title,
        pass_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_email', session.user.email)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating pass:', updateError)
      return NextResponse.json({ error: 'Failed to update pass' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      pass: updatedPass,
      message: 'Pass updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT pass:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/passes/[id] - Delete a specific pass
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabaseClient = supabase
    
    // First verify the pass exists and belongs to the user
    const { data: existingPass, error: fetchError } = await supabaseClient
      .from('passes')
      .select('id, title')
      .eq('id', id)
      .eq('user_email', session.user.email)
      .single()

    if (fetchError || !existingPass) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }

    // Delete the pass
    const { error: deleteError } = await supabaseClient
      .from('passes')
      .delete()
      .eq('id', id)
      .eq('user_email', session.user.email)

    if (deleteError) {
      console.error('Error deleting pass:', deleteError)
      return NextResponse.json({ error: 'Failed to delete pass' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Pass "${existingPass.title}" deleted successfully`
    })
  } catch (error) {
    console.error('Error in DELETE pass:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}