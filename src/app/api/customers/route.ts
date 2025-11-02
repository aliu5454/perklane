import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get all customers for a business with search capability
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = await createClient();
    
    // Get the business email directly from the session
    const businessEmail = session.user.email;
    
    if (!businessEmail) {
      return NextResponse.json({ success: false, error: 'Business email not found in session' }, { status: 400 });
    }
    
    // Get search parameters
    const searchQuery = request.nextUrl.searchParams.get('search') || '';
    const programId = request.nextUrl.searchParams.get('programId');
    
    // Build base query to get customers who are part of this business's programs
    let query = supabase
      .from('customer_programs')
      .select(`
        id,
        points,
        tier,
        joined_at,
        last_activity,
        program_id,
        customers (
          id, 
          phone_number,
          full_name,
          email
        )
      `)
      .eq('business_email', businessEmail);
      
    // // Add program filter if specified
    // if (programId) {
    //   query = query.eq('program_id', programId);
    // }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch customers' }, { status: 500 });
    }
    
    // Filter customers based on search query
    const filteredCustomers = searchQuery 
      ? data.filter(item => {
          const customer = item.customers as { 
            phone_number?: string; 
            full_name?: string; 
            email?: string; 
          };
          const searchLower = searchQuery.toLowerCase();
          return (
            customer.phone_number?.toLowerCase().includes(searchLower) ||
            customer.full_name?.toLowerCase().includes(searchLower) ||
            customer.email?.toLowerCase().includes(searchLower)
          );
        })
      : data;
    
    return NextResponse.json({ success: true, customers: filteredCustomers });
  } catch (error) {
    console.error('Customer fetch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}