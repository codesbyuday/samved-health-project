import { supabase } from '@/lib/supabase';

// =====================
// Storage Service for Supabase Storage
// =====================

export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const SIGNED_URL_EXPIRY = 60; // 60 seconds

export interface UploadResult {
  path: string;
  error: string | null;
}

export interface SignedUrlResult {
  url: string | null;
  error: string | null;
}

export const storageService = {
  /**
   * Upload a file to the lab_reports bucket
   * @param file - The file to upload
   * @param fileName - Custom file name (optional, will generate if not provided)
   * @returns UploadResult with path or error
   */
  async uploadLabReport(file: File, fileName?: string): Promise<UploadResult> {
    try {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return {
          path: '',
          error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.'
        };
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return {
          path: '',
          error: 'File size exceeds 5 MB limit. Please select a smaller file.'
        };
      }

      // Generate file name if not provided
      const finalFileName = fileName || generateReportFileName(file.name);
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('lab_reports')
        .upload(finalFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        return {
          path: '',
          error: parseStorageError(error)
        };
      }

      return {
        path: data.path,
        error: null
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        path: '',
        error: 'An unexpected error occurred while uploading the file.'
      };
    }
  },

  /**
   * Get a signed URL for viewing/downloading a file
   * @param path - The file path in storage
   * @returns SignedUrlResult with URL or error
   */
  async getSignedUrl(path: string): Promise<SignedUrlResult> {
    try {
      const { data, error } = await supabase.storage
        .from('lab_reports')
        .createSignedUrl(path, SIGNED_URL_EXPIRY);

      if (error) {
        console.error('Signed URL error:', error);
        return {
          url: null,
          error: 'Failed to generate file access URL. Please try again.'
        };
      }

      return {
        url: data.signedUrl,
        error: null
      };
    } catch (error) {
      console.error('Signed URL error:', error);
      return {
        url: null,
        error: 'An unexpected error occurred while generating the file URL.'
      };
    }
  },

  /**
   * Download a file (opens in new tab or downloads)
   * @param path - The file path in storage
   * @param action - 'view' to open in new tab, 'download' to force download
   */
  async viewOrDownloadFile(path: string, action: 'view' | 'download' = 'view'): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from('lab_reports')
        .createSignedUrl(path, SIGNED_URL_EXPIRY, {
          download: action === 'download'
        });

      if (error) {
        return {
          success: false,
          error: 'Failed to access the file. Please try again.'
        };
      }

      // Open in new tab for viewing, or trigger download
      if (action === 'view') {
        window.open(data.signedUrl, '_blank');
      } else {
        // For download, create a temporary anchor and click it
        const link = window.document.createElement('a');
        link.href = data.signedUrl;
        link.download = path.split('/').pop() || 'report';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while accessing the file.'
      };
    }
  },

  /**
   * Delete a file from storage
   * @param path - The file path to delete
   */
  async deleteFile(path: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.storage
        .from('lab_reports')
        .remove([path]);

      if (error) {
        return {
          success: false,
          error: 'Failed to delete the file. Please try again.'
        };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while deleting the file.'
      };
    }
  },

  /**
   * Check if a file exists in storage
   * @param path - The file path to check
   */
  async fileExists(path: string): Promise<{ exists: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from('lab_reports')
        .list(path.substring(0, path.lastIndexOf('/')), {
          search: path.split('/').pop()
        });

      if (error) {
        return { exists: false, error: parseStorageError(error) };
      }

      const fileName = path.split('/').pop();
      const exists = data?.some(file => file.name === fileName) || false;

      return { exists, error: null };
    } catch (error) {
      return { exists: false, error: 'Failed to check file existence.' };
    }
  }
};

/**
 * Generate a unique file name for lab reports
 */
function generateReportFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'pdf';
  return `reports/REP${timestamp}${random}.${extension}`;
}

/**
 * Parse storage errors into user-friendly messages
 */
function parseStorageError(error: { message?: string; statusCode?: string | number }): string {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('not found') || error.statusCode === 404) {
    return 'The file could not be found.';
  }
  
  if (message.includes('unauthorized') || error.statusCode === 401) {
    return 'You do not have permission to access this file.';
  }
  
  if (message.includes('already exists') || message.includes('duplicate')) {
    return 'A file with this name already exists. Please try again.';
  }
  
  if (message.includes('bucket') && message.includes('not found')) {
    return 'Storage bucket not configured. Please contact administrator.';
  }
  
  if (message.includes('payload') || message.includes('size')) {
    return 'File is too large. Maximum size is 5 MB.';
  }
  
  return 'An error occurred while accessing the file storage. Please try again.';
}

export default storageService;
