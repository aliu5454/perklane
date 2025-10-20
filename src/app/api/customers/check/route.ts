import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Check if a customer exists by phone number
 * GET /api/customers/check?phone=+1234567890
 */
export async function GET(request: NextRequest) {
  try {
    const phoneNumber = request.nextUrl.searchParams.get('phone');
    
    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Format phone number to E.164 standard if not already formatted
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+${phoneNumber}`;
    }
    
    // Check if the customer exists
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('phone_number', formattedPhoneNumber)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Record not found error
        return NextResponse.json({ success: false, exists: false });
      }
      
      console.error('Error checking customer:', error);
      return NextResponse.json({ success: false, error: 'Failed to check customer' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      exists: !!data,
      customer: data ? {
        id: data.id,
        full_name: data.full_name
      } : null
    });
  } catch (error) {
    console.error('Customer check error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}