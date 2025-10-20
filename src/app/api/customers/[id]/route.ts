import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Get customer points for a specific program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const programId = request.nextUrl.searchParams.get('programId');
    
    if (!customerId || !programId) {
      return NextResponse.json({ success: false, error: 'Customer ID and program ID are required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Get the customer's points in the specified program
    const { data, error } = await supabase
      .from('customer_programs')
      .select('points, tier')
      .eq('customer_id', customerId)
      .eq('program_id', programId)
      .maybeSingle(); // Use maybeSingle instead of single to handle when no record exists
      
    if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
      console.error('Error fetching customer points:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch customer points' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      points: data?.points || 0,
      tier: data?.tier || 'standard'
    });
  } catch (error) {
    console.error('Customer points fetch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}