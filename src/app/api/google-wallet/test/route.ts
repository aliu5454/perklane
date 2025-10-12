import { NextResponse } from "next/server";
import { GoogleAuth } from 'google-auth-library'
import { getGoogleServiceAccount } from '@/lib/google-service-account'

export async function GET() {
  try {
    // Test Google Auth setup
    const auth = new GoogleAuth({
      credentials: getGoogleServiceAccount(),
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
    })

    const authClient = await auth.getClient()
    const projectId = await auth.getProjectId()

    // Test API connection
    const baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1'
    
    // Try to list existing classes (this will verify auth works)
    const response = await authClient.request({
      url: `${baseUrl}/loyaltyClass?issuerId=${process.env.GOOGLE_WALLET_ISSUER_ID}`,
      method: 'GET'
    })

    return NextResponse.json({
      success: true,
      message: "Google Wallet API connection successful",
      projectId,
      issuerID: process.env.GOOGLE_WALLET_ISSUER_ID,
      existingClasses: response.data,
      authWorking: true
    });

  } catch (error: any) {
    console.error('Google Wallet API Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data,
      authWorking: false
    }, { status: 500 });
  }
}