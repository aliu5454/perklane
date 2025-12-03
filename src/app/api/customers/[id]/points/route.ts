import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Update customer points
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const customerProgramId = resolvedParams.id;
    const { points, tier, updateType, description } = await request.json();
    
    const supabase = await createClient();
    
    // Get the business email directly from the session
    const businessEmail = session.user.email;
    
    if (!businessEmail) {
      return NextResponse.json({ success: false, error: 'Business email not found in session' }, { status: 400 });
    }
    
    // First check if this customer program belongs to this business
    const { data: programData, error: programError } = await supabase
      .from('customer_programs')
      .select('points, business_email')
      .eq('id', customerProgramId)
      .single();
      
    if (programError || !programData) {
      return NextResponse.json({ success: false, error: 'Customer program not found' }, { status: 404 });
    }
    
    // Verify that this business owns this customer program
    if (programData.business_email !== businessEmail) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    
    // Calculate points change for transaction log
    let pointsChange = 0;
    if (updateType === 'set') {
      pointsChange = points - programData.points;
    } else if (updateType === 'add') {
      pointsChange = points;
    } else if (updateType === 'subtract') {
      pointsChange = -points;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid update type' }, { status: 400 });
    }
    
    // Start a transaction
    // Use the version that handles email input but works with UUID in the database
    const { data, error } = await supabase.rpc('update_customer_points_with_email', {
      p_customer_program_id: customerProgramId,
      p_points_change: pointsChange,
      p_tier: tier || undefined,
      p_transaction_type: updateType,
      p_description: `${description || ''} (By: ${businessEmail})`, // Include email in description
      p_created_by: businessEmail  // Email will be used to look up UUID
    });
    
    if (error) {
      console.error('Error updating points:', error);
      return NextResponse.json({ success: false, error: 'Failed to update points' }, { status: 500 });
    }
    
    // After successful points update, attempt to push updates to linked wallet objects.
    // Run before sending the response, but do not fail the request if this best-effort step has issues.
    try {
      // Fetch registrations in pass_customers for this customer program
      const { data: registrations, error: registrationsError } = await supabase
        .from('pass_customers')
        .select('*')
        .eq('customer_program_id', customerProgramId)

      if (registrationsError) {
        console.warn('Unable to fetch wallet registrations; continuing without wallet sync', registrationsError)
      } else {
        console.log('Found wallet registrations for customer program:', registrations)

        if (registrations && registrations.length > 0) {
          const { enqueueJob } = await import('@/lib/wallet-job-queue')
          const newPoints = parseInt(data?.new_points?.toString() || '0', 10) || 0

          for (const reg of registrations) {
            try {
              // Enqueue Google patch job
              if (reg.google_object_id) {
                await enqueueJob({
                  type: 'google_patch',
                  payload: { objectId: reg.google_object_id, balance: newPoints }
                })
              }

              // Enqueue Apple regenerate + APNS job
              if (reg.apple_serial_number && reg.pass_id) {
                await enqueueJob({
                  type: 'regenerate_pkpass',
                  payload: { passId: reg.pass_id, registrationId: reg.id, deviceToken: reg.apple_device_token }
                })
              }
            } catch (innerErr) {
              console.error('Failed to enqueue wallet job for registration', reg, innerErr)
            }
          }
        }
      }
    } catch (pushErr) {
      console.warn('Wallet push updates error (response not blocked):', pushErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Customer points updated successfully',
      data
    });
  } catch (error) {
    console.error('Points update error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
