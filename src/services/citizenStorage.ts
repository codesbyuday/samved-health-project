import { supabase } from '@/lib/supabase';

// =====================
// Citizen Photo Storage Service
// =====================

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_PHOTO_SIZE = 50 * 1024; // 50 KB

export interface PhotoUploadResult {
  path: string;
  url: string;
  error: string | null;
}

export const citizenStorageService = {
  /**
   * Upload a citizen photo to the citizen_photos bucket
   * @param file - The photo file to upload
   * @param citizenId - The citizen ID for naming
   * @returns PhotoUploadResult with path, url or error
   */
  async uploadPhoto(file: File, citizenId: string): Promise<PhotoUploadResult> {
    try {
      // Validate file type
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        return {
          path: '',
          url: '',
          error: 'Invalid file type. Only JPG, PNG, and WEBP files are allowed.'
        };
      }

      // Validate file size (50 KB max)
      if (file.size > MAX_PHOTO_SIZE) {
        return {
          path: '',
          url: '',
          error: 'File size exceeds 50 KB limit. Please select a smaller photo or compress it.'
        };
      }

      // Generate file name
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${citizenId.replace(/-/g, '')}.${extension}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('citizen_photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing photo
        });

      if (error) {
        console.error('Photo upload error:', error);
        return {
          path: '',
          url: '',
          error: parsePhotoStorageError(error)
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('citizen_photos')
        .getPublicUrl(data.path);

      return {
        path: data.path,
        url: urlData.publicUrl,
        error: null
      };
    } catch (error) {
      console.error('Photo upload error:', error);
      return {
        path: '',
        url: '',
        error: 'An unexpected error occurred while uploading the photo.'
      };
    }
  },

  /**
   * Get the public URL for a citizen photo
   * @param path - The file path in storage
   * @returns Public URL string
   */
  getPhotoUrl(path: string): string {
    const { data } = supabase.storage
      .from('citizen_photos')
      .getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Delete a citizen photo from storage
   * @param path - The file path to delete
   */
  async deletePhoto(path: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.storage
        .from('citizen_photos')
        .remove([path]);

      if (error) {
        return {
          success: false,
          error: 'Failed to delete the photo. Please try again.'
        };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Photo delete error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while deleting the photo.'
      };
    }
  }
};

/**
 * Parse storage errors into user-friendly messages
 */
function parsePhotoStorageError(error: { message?: string; statusCode?: string | number }): string {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('not found') || error.statusCode === 404) {
    return 'Storage bucket not found. Please contact administrator.';
  }
  
  if (message.includes('unauthorized') || error.statusCode === 401) {
    return 'You do not have permission to upload photos.';
  }
  
  if (message.includes('payload') || message.includes('size')) {
    return 'File is too large. Maximum size is 50 KB.';
  }
  
  return 'An error occurred while uploading the photo. Please try again.';
}

export default citizenStorageService;

// =====================
// Convenience function for CitizenServices
// =====================

export async function uploadCitizenPhoto(
  citizenId: string,
  file: File
): Promise<{ publicUrl: string | null; error: string | null }> {
  const result = await citizenStorageService.uploadPhoto(file, citizenId);
  return {
    publicUrl: result.url || null,
    error: result.error
  };
}
