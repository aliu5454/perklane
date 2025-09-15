import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

// Simple function to generate unique filename without external dependencies
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export async function POST(request: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id

    const data = await request.formData()
    const file: File | null = data.get('image') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'png'
    const uniqueFilename = `${generateUniqueId()}.${fileExtension}`
    
    // Upload to Supabase Storage using service role key for proper permissions
    const supabase = await createClient()
    
    // Use service role client for storage operations if available
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase
    
    // Check if bucket exists and create if it doesn't
    try {
      const { data: buckets, error: listError } = await storageClient.storage.listBuckets()
      
      if (listError) {
        console.error('Error listing buckets:', listError)
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'pass-images')
      
      if (!bucketExists) {
        console.log('Creating pass-images bucket...')
        const { data: newBucket, error: createError } = await storageClient.storage.createBucket('pass-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })
        
        if (createError) {
          console.error('Error creating bucket:', createError)
          return NextResponse.json({ 
            success: false,
            error: `Failed to create storage bucket: ${createError.message}. Please create the 'pass-images' bucket manually in your Supabase dashboard.`
          }, { status: 500 })
        }
        
        console.log('Created pass-images bucket successfully')
      }
    } catch (bucketError: any) {
      console.error('Bucket check/creation error:', bucketError)
      // Continue with upload attempt even if bucket check fails
    }
    
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('pass-images')
      .upload(`uploads/${uniqueFilename}`, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      console.error('Upload error details:', {
        message: uploadError.message
      })
      
      // Provide specific guidance for bucket-related errors
      let errorMessage = `Failed to upload image to storage: ${uploadError.message}`
      
      if (uploadError.message.includes('Bucket not found')) {
        errorMessage = `Storage bucket 'pass-images' not found. Please create it manually in your Supabase dashboard:
1. Go to Storage → Buckets
2. Click 'New Bucket'
3. Name: 'pass-images'
4. Set Public: true
5. Click 'Create Bucket'`
      }
      
      return NextResponse.json({ 
        success: false,
        error: errorMessage
      }, { status: 500 })
    }

    // Get public URL using the same client
    const { data: { publicUrl } } = storageClient.storage
      .from('pass-images')
      .getPublicUrl(`uploads/${uniqueFilename}`)

    // Store metadata in database (optional - will fail silently if database is not set up)
    try {
      const { error: dbError } = await supabase
        .from('image_metadata')
        .insert({
          filename: uniqueFilename,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          public_url: publicUrl,
          uploaded_by: userId,
          created_at: new Date().toISOString()
        })

      if (dbError) {
        console.warn('Failed to store image metadata in database:', dbError)
        // Continue anyway - the file was uploaded successfully
      } else {
        console.log('Image metadata stored successfully')
      }
    } catch (dbError) {
      console.warn('Image metadata table not available or configured, skipping metadata storage:', dbError)
      // Continue anyway - the file was uploaded successfully
    }

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}