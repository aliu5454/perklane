import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Mock Analytics API Endpoint
 * 
 * This endpoint provides mock analytics data for demonstration purposes.
 * In a real implementation, this would connect to your analytics database
 * and return actual usage metrics.
 */
export async function GET(req: Request) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: "Authentication required" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const passId = searchParams.get('passId');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Mock analytics data - replace with actual database queries
    const mockAnalyticsData = {
      totalViews: Math.floor(Math.random() * 1000) + 100,
      totalDownloads: Math.floor(Math.random() * 500) + 50,
      conversionRate: Math.floor(Math.random() * 50) + 15,
      activePasses: Math.floor(Math.random() * 200) + 20,
      popularDevices: [
        { device: 'iPhone', count: Math.floor(Math.random() * 100) + 50 },
        { device: 'Android', count: Math.floor(Math.random() * 80) + 30 },
        { device: 'Desktop', count: Math.floor(Math.random() * 40) + 10 },
      ],
      viewsOverTime: Array.from({ length: parseInt(timeRange) || 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50) + 10,
        downloads: Math.floor(Math.random() * 20) + 2,
      })),
      passPerformance: [
        {
          passId: passId || '1',
          title: 'Loyalty Card Program',
          views: Math.floor(Math.random() * 200) + 20,
          downloads: Math.floor(Math.random() * 100) + 10,
        },
        {
          passId: '2',
          title: 'Gift Card Special',
          views: Math.floor(Math.random() * 150) + 15,
          downloads: Math.floor(Math.random() * 75) + 8,
        },
        {
          passId: '3',
          title: 'Holiday Offer',
          views: Math.floor(Math.random() * 300) + 30,
          downloads: Math.floor(Math.random() * 120) + 15,
        }
      ],
      customers: Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, i) => {
        const statuses = ['Active', 'Expired', 'Revoked'];
        const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Chris Brown', 'Emma Davis', 'Alex Miller', 'Lisa Garcia', 'David Martinez', 'Amy Taylor'];
        const devices = [
          { device: 'iPhone 15', os: 'iOS 17.2', walletApp: 'Apple Wallet' },
          { device: 'Samsung Galaxy S24', os: 'Android 14', walletApp: 'Google Wallet' },
          { device: 'Google Pixel 8', os: 'Android 14', walletApp: 'Google Wallet' },
          { device: 'iPhone 14', os: 'iOS 16.7', walletApp: 'Apple Wallet' }
        ];
        const locations = [
          { city: 'New York', country: 'United States' },
          { city: 'Los Angeles', country: 'United States' },
          { city: 'Chicago', country: 'United States' },
          { city: 'Houston', country: 'United States' },
          { city: 'Miami', country: 'United States' },
          { city: 'Toronto', country: 'Canada' },
          { city: 'London', country: 'United Kingdom' }
        ];
        
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomDevice = devices[Math.floor(Math.random() * devices.length)];
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        
        return {
          id: `customer_${i + 1}`,
          name: randomName,
          email: `${randomName.toLowerCase().replace(' ', '.')}@example.com`,
          phone: Math.random() > 0.3 ? `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
          dateAdded: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: randomStatus,
          points: Math.floor(Math.random() * 500),
          punchCount: Math.floor(Math.random() * 10),
          deviceInfo: randomDevice,
          location: randomLocation,
          lastActivity: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalSpent: Math.floor(Math.random() * 1000) + 50,
          visits: Math.floor(Math.random() * 20) + 1,
          preferences: ['Email notifications', 'SMS alerts', 'Push notifications'].filter(() => Math.random() > 0.5)
        };
      }),
      insights: {
        topPerformingDevice: 'iPhone',
        peakViewTime: '2:00 PM - 4:00 PM',
        averageTimeToDownload: '2.3 minutes',
        popularDayOfWeek: 'Tuesday'
      }
    };

    return NextResponse.json({
      success: true,
      data: mockAnalyticsData,
      timeRange,
      passId,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch analytics data',
      }, 
      { status: 500 }
    );
  }
}