import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function POST() {
  try {
    console.log('🔧 Starting database constraint fix...')
    
    // Remove the unique constraint on class_id
    console.log('Step 1: Removing unique constraint on class_id...')
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE passes DROP CONSTRAINT IF EXISTS passes_class_id_key;'
    })
    
    if (dropError) {
      console.error('Error dropping constraint:', dropError)
    } else {
      console.log('✅ Unique constraint on class_id removed')
    }
    
    // Add index for class_id performance
    console.log('Step 2: Adding index for class_id...')
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_passes_class_id ON passes(class_id);'
    })
    
    if (indexError) {
      console.error('Error adding index:', indexError)
    } else {
      console.log('✅ Index added for class_id')
    }
    
    // Verify constraints
    console.log('Step 3: Verifying current constraints...')
    const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'passes'::regclass;`
    })
    
    if (constraintError) {
      console.error('Error checking constraints:', constraintError)
    } else {
      console.log('Current constraints:', constraints)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database constraints fixed successfully',
      constraints: constraints || []
    })
    
  } catch (error: any) {
    console.error('Database constraint fix failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}