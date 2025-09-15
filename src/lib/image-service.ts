import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with service role for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface ImageMetadata {
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  public_url: string
  uploaded_by?: string
}

export class ImageService {
  /**
   * Store image metadata in the database
   */
  static async storeImageMetadata(metadata: ImageMetadata) {
    try {
      const { data, error } = await supabaseAdmin
        .from('images')
        .insert({
          filename: metadata.filename,
          original_name: metadata.original_name,
          file_size: metadata.file_size,
          mime_type: metadata.mime_type,
          public_url: metadata.public_url,
          uploaded_by: metadata.uploaded_by || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error storing image metadata:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to store image metadata:', error)
      throw error
    }
  }

  /**
   * Get image metadata by filename
   */
  static async getImageByFilename(filename: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('images')
        .select('*')
        .eq('filename', filename)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching image metadata:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to fetch image metadata:', error)
      throw error
    }
  }

  /**
   * Get all images uploaded by a specific user
   */
  static async getImagesByUser(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('images')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user images:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch user images:', error)
      throw error
    }
  }

  /**
   * Delete image metadata (call this when deleting the actual file)
   */
  static async deleteImageMetadata(filename: string, userId?: string) {
    try {
      let query = supabaseAdmin
        .from('images')
        .delete()
        .eq('filename', filename)

      // If userId is provided, ensure the user owns the image
      if (userId) {
        query = query.eq('uploaded_by', userId)
      }

      const { error } = await query

      if (error) {
        console.error('Error deleting image metadata:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Failed to delete image metadata:', error)
      throw error
    }
  }

  /**
   * Clean up orphaned images (images without metadata or vice versa)
   * This would typically be run as a scheduled job
   */
  static async cleanupOrphanedImages() {
    // This is a placeholder for cleanup logic
    // You would implement file system scanning and database comparison
    console.log('Image cleanup not implemented yet')
  }
}

export default ImageService