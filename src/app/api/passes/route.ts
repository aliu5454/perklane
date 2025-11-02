import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(req: Request) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 });
    }

    // Fetch user's passes
    const { data: passes, error } = await supabase
      .from('passes')
      .select('*')
      .eq('user_email', session.user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: "Failed to fetch passes" 
      }, { status: 500 });
    }

    // Calculate stats
    const stats = {
      totalPasses: passes?.length || 0,
      activeCards: passes?.filter(pass => pass.status === 'active').length || 0,
      passTypes: passes?.reduce((acc: any, pass) => {
        acc[pass.pass_type] = (acc[pass.pass_type] || 0) + 1;
        return acc;
      }, {}) || {}
    };

    return NextResponse.json({
      passes: passes || [],
      stats,
      email: session.user.email
    });

  } catch (error: any) {
    console.error('Fetch passes error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch passes'
      }, 
      { status: 500 }
    );
  }
}