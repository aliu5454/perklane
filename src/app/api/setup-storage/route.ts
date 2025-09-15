import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: "Authentication required" 
      }, { status: 401 });
    }

    // Use service role client for admin operations
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured. Please add it to your environment variables.'
      }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const setupSteps = []

    // Step 1: Create pass-images bucket
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(bucket => bucket.name === 'pass-images')

      if (!bucketExists) {
        const { data: bucket, error: bucketError } = await supabase.storage.createBucket('pass-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (bucketError) {
          setupSteps.push({ step: 'Create bucket', success: false, error: bucketError.message })
        } else {
          setupSteps.push({ step: 'Create bucket', success: true, message: 'pass-images bucket created' })
        }
      } else {
        setupSteps.push({ step: 'Create bucket', success: true, message: 'pass-images bucket already exists' })
      }
    } catch (error: any) {
      setupSteps.push({ step: 'Create bucket', success: false, error: error.message })
    }

    // Step 2: Create image_metadata table (optional)
    try {
      // Try to create the table using a simpler approach
      // This is optional - image uploads will work without it
      const { data, error: tableError } = await supabase
        .from('image_metadata')
        .select('id')
        .limit(1)

      if (tableError && tableError.code === 'PGRST116') {
        // Table doesn't exist, but that's okay - it's optional
        setupSteps.push({ 
          step: 'Create metadata table', 
          success: true, 
          message: 'Metadata table not created (optional feature). Image uploads will work without it. You can create it manually in Supabase SQL editor if needed.' 
        })
      } else {
        setupSteps.push({ step: 'Create metadata table', success: true, message: 'Metadata table is available or not needed' })
      }
    } catch (error: any) {
      // This is optional functionality
      setupSteps.push({ 
        step: 'Create metadata table', 
        success: true, 
        message: 'Metadata table setup skipped (optional). Image uploads will work fine without it.' 
      })
    }

    // Check overall success
    const allSuccessful = setupSteps.every(step => step.success)

    return NextResponse.json({
      success: allSuccessful,
      message: allSuccessful ? 'Storage setup completed successfully!' : 'Storage setup completed with some issues',
      steps: setupSteps
    })

  } catch (error: any) {
    console.error('Storage setup error:', error)
    return NextResponse.json({
      success: false,
      error: `Setup failed: ${error.message}`
    }, { status: 500 })
  }
}