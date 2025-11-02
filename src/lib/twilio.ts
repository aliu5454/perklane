import twilio from 'twilio';

// Initialize Twilio client
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Function to send OTP via SMS
export async function sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    await twilioClient.messages.create({
      body: `Your Perklane verification code is: ${otp}`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP via Twilio:', error);
    return false;
  }
}

// Generate a random OTP
export function generateOTP(length = 6): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}