import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateOTP, sendOTP } from '@/lib/twilio';

// Handle sending OTP to customer's phone
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Format phone number to E.164 standard if not already formatted
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+${phoneNumber}`;
    }
    
    // Generate a new 6-digit OTP
    const otp = generateOTP(6);
    
    // Set expiration time (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    // Store OTP in database
    const supabase = await createClient();
    
    // Delete any existing unverified OTPs for this phone number to prevent spam
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('phone_number', formattedPhoneNumber)
      .eq('verified', false);
      
    // Insert new OTP record
    const { error } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: formattedPhoneNumber,
        otp,
        expires_at: expiresAt.toISOString(),
      });
      
    if (error) {
      console.error('Error storing OTP:', error);
      return NextResponse.json({ success: false, error: 'Failed to create verification code' }, { status: 500 });
    }
    
    // Send OTP via SMS
    const sent = await sendOTP(formattedPhoneNumber, otp);
    
    if (!sent) {
      return NextResponse.json({ success: false, error: 'Failed to send verification code' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent',
      phoneNumber: formattedPhoneNumber,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}