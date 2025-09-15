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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Debug: Database connection test started');
    console.log('Debug: Session exists:', !!session);
    console.log('Debug: User email:', session?.user?.email);

    // Test 1: Can we connect to Supabase?
    const { data: connectionTest, error: connectionError } = await supabase
      .from('passes')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('Debug: Connection error:', connectionError);
      return NextResponse.json({
        success: false,
        test: 'database_connection',
        error: connectionError,
        details: {
          message: connectionError.message,
          code: connectionError.code,
          details: connectionError.details,
          hint: connectionError.hint
        }
      });
    }

    // Test 2: Can we query the passes table?
    const { data: tableTest, error: tableError } = await supabase
      .from('passes')
      .select('*')
      .limit(5);

    if (tableError) {
      console.error('Debug: Table query error:', tableError);
      return NextResponse.json({
        success: false,
        test: 'table_query',
        error: tableError,
        details: {
          message: tableError.message,
          code: tableError.code,
          details: tableError.details,
          hint: tableError.hint
        }
      });
    }

    // Test 3: Can we insert a test record?
    if (session?.user?.email) {
      const testRecord = {
        user_email: session.user.email,
        pass_type: 'generic',
        title: 'Debug Test Pass',
        pass_data: { test: true },
        class_id: `debug.test_class_${Date.now()}`,
        object_id: `debug.test_object_${Date.now()}`,
        qr_code_url: 'https://example.com/qr',
        pass_url: 'https://example.com/pass',
        status: 'active'
      };

      const { data: insertTest, error: insertError } = await supabase
        .from('passes')
        .insert(testRecord)
        .select()
        .single();

      if (insertError) {
        console.error('Debug: Insert error:', insertError);
        return NextResponse.json({
          success: false,
          test: 'insert_test',
          error: insertError,
          testRecord,
          details: {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          }
        });
      }

      // Clean up test record
      if (insertTest?.id) {
        await supabase
          .from('passes')
          .delete()
          .eq('id', insertTest.id);
      }

      return NextResponse.json({
        success: true,
        message: 'All database tests passed!',
        tests: {
          connection: 'PASS',
          table_query: 'PASS',
          insert_test: 'PASS'
        },
        tableData: tableTest,
        insertedRecord: insertTest
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Connection and table query tests passed (no session for insert test)',
      tests: {
        connection: 'PASS',
        table_query: 'PASS',
        insert_test: 'SKIPPED (no session)'
      },
      tableData: tableTest
    });

  } catch (error: any) {
    console.error('Debug: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      test: 'unexpected_error',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}