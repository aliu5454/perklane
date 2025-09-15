import { NextResponse } from "next/server";

// Helper function to shorten URLs using TinyURL
async function shortenUrl(longUrl: string): Promise<string> {
  try {
    console.log('🔗 Shortening URL:', longUrl.substring(0, 100) + '...');
    
    const tinyUrlResponse = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    
    if (!tinyUrlResponse.ok) {
      throw new Error(`TinyURL API responded with status: ${tinyUrlResponse.status}`);
    }
    
    const shortUrl = await tinyUrlResponse.text();
    
    // Validate that we got a proper TinyURL response
    if (shortUrl.startsWith('http') && shortUrl.includes('tinyurl.com')) {
      console.log('✅ URL shortened successfully:', shortUrl);
      return shortUrl;
    } else {
      throw new Error(`Invalid TinyURL response: ${shortUrl}`);
    }
  } catch (error) {
    console.warn('⚠️ URL shortening failed:', error);
    // Return original URL if shortening fails
    return longUrl;
  }
}

/**
 * Debug endpoint to test QR code generation with URL shortening
 */
export async function GET() {
  try {
    const testUrl = "https://pay.google.com/gp/v/save/eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiYXVkIjoiZ29vZ2xlIiwib3JpZ2lucyI6WyJsb2NhbGhvc3Q6MzAwMCJdLCJ0eXAiOiJzYXZldG93YWxsZXQiLCJpYXQiOjE2MzQ2NzE4MDAsInBheWxvYWQiOnsiZ2VuZXJpY0NsYXNzZXMiOlt7ImlkIjoidGVzdCIsImlzc3Vlck5hbWUiOiJUZXN0IEluYyIsInJldmlld1N0YXR1cyI6IlVOREVSX1JFVklFVyJ9XSwiZ2VuZXJpY09iamVjdHMiOlt7ImlkIjoidGVzdC1vYmplY3QiLCJjbGFzc0lkIjoidGVzdCIsInN0YXRlIjoiQUNUSVZFIn1dfX0.test-signature";
    
    console.log('Testing URL shortening...');
    const shortUrl = await shortenUrl(testUrl);
    
    const qrCodes = {
      original: {
        qrServer: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(testUrl)}&format=png&ecc=L&margin=5`,
        googleCharts: `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(testUrl)}&choe=UTF-8`
      },
      shortened: {
        qrServer: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shortUrl)}&format=png&ecc=M&margin=5`,
        googleCharts: `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(shortUrl)}&choe=UTF-8`
      }
    };

    return NextResponse.json({
      success: true,
      message: "QR code test with URL shortening",
      urls: {
        originalUrl: testUrl,
        originalLength: testUrl.length,
        shortUrl: shortUrl,
        shortLength: shortUrl.length,
        reductionRatio: `${Math.round((1 - shortUrl.length / testUrl.length) * 100)}% shorter`
      },
      qrCodes,
      instructions: "Compare the QR codes - shortened URLs should be much more reliable and scan better",
      recommendation: "Use the shortened URL QR codes - they should work perfectly now!"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      note: "URL shortening test failed"
    }, { status: 500 });
  }
}