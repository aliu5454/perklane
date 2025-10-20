import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Handle verifying OTP entered by customer
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, fullName } = await request.json();
    
    if (!phoneNumber || !otp) {
      return NextResponse.json({ success: false, error: 'Phone number and OTP are required' }, { status: 400 });
    }

    // Format phone number to E.164 standard if not already formatted
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+${phoneNumber}`;
    }
    
    // Get current timestamp
    const now = new Date().toISOString();
    
    // Check OTP against database
    const supabase = await createClient();
    const { data: verificationData, error: verificationError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', formattedPhoneNumber)
      .eq('otp', otp)
      .eq('verified', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (verificationError || !verificationData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired verification code' 
      }, { status: 400 });
    }
    
    // Mark OTP as verified
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', verificationData.id);
      
    // Check if the customer already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone_number', formattedPhoneNumber)
      .single();
      
    let customerId;
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
      
      // Get existing customer details to check if name is already set
      const { data: customerDetails } = await supabase
        .from('customers')
        .select('full_name')
        .eq('id', customerId)
        .single();
      
      // Update customer name if provided and if it was not already set
      if (fullName && !customerDetails?.full_name) {
        await supabase
          .from('customers')
          .update({ full_name: fullName })
          .eq('id', customerId);
      }
    } else {
      // Create new customer record
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          phone_number: formattedPhoneNumber,
          full_name: fullName || null
        })
        .select('id')
        .single();
        
      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json({ success: false, error: 'Failed to create customer' }, { status: 500 });
      }
      
      customerId = newCustomer.id;
    }
    
    // Create or update customer program membership if pass/program ID is provided
    const programId = request.nextUrl.searchParams.get('programId');
    const businessEmail = request.nextUrl.searchParams.get('businessEmail');
    
    if (programId && businessEmail) {
      try {
        // First check if customer is already enrolled in this program using email directly
        const { data: existingEnrollment, error: enrollmentError } = await supabase
          .from('customer_programs')
          .select('id, points')
          .eq('customer_id', customerId)
          .eq('program_id', programId)
          .eq('business_email', businessEmail)
          .maybeSingle(); // Use maybeSingle to handle non-existent records
        
          if (existingEnrollment) {
            console.log('Customer already enrolled in program:', existingEnrollment);
            // No need to do anything, customer is already enrolled
          } else if (!enrollmentError || enrollmentError.code === 'PGRST116') { 
            // Only try to insert if there's no error or it's just the "no rows" error
            // Add customer to program
            const { error: programError } = await supabase
              .from('customer_programs')
              .insert({
                customer_id: customerId,
                program_id: programId,
                business_email: businessEmail,
                points: 0,
                tier: 'standard',
                joined_at: new Date().toISOString(),
                last_activity: new Date().toISOString()
              });
              
            if (programError) {
              console.error('Error adding customer to program:', programError);
              // We'll still consider the verification successful even if program update fails
            } else {
              console.log('Customer successfully added to program');
            }
          }
      } catch (error) {
        console.error('Error managing program enrollment:', error);
        // Don't fail verification if program enrollment fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Phone number verified successfully',
      customerId
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}