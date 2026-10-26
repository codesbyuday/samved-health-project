import { supabase } from './supabase';

const BUCKET_NAME = 'lab_reports';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

/**
 * Upload a diagnostic report file (PDF or Image) to Supabase Storage 'lab_reports' bucket
 * @param {File} file - File from file input
 * @param {string} citizenId - Citizen Health ID for reference
 * @returns {Promise<{ path: string|null, url: string|null, error: string|null }>}
 */
export async function uploadReportFile(file, citizenId = 'patient') {
  if (!supabase) {
    return { path: null, url: null, error: 'Supabase client is not initialized.' };
  }

  if (!file) {
    return { path: null, url: null, error: 'No file selected.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      path: null,
      url: null,
      error: 'Invalid file format. Please upload a PDF document (.pdf) or image (.jpg, .png).',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      path: null,
      url: null,
      error: 'File size exceeds 10 MB limit. Please compress or select a smaller file.',
    };
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const cleanCitizenId = String(citizenId).replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const filePath = `reports/${cleanCitizenId}_${timestamp}_${randomHex}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { path: null, url: null, error: error.message || 'Failed to upload report to storage.' };
    }

    // Generate signed URL for immediate viewing (valid for 24 hours / 86400s)
    const { data: signedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, 86400);

    return {
      path: data.path,
      url: signedData?.signedUrl || null,
      error: null,
    };
  } catch (err) {
    console.error('Unexpected upload exception:', err);
    return { path: null, url: null, error: err.message || 'Unexpected error uploading file.' };
  }
}

/**
 * Resolve a viewable URL for a stored report file (signed URL if stored in bucket, or direct URL)
 * @param {string} reportFileUrl - Stored file path or full URL
 * @returns {Promise<string|null>}
 */
export async function getReportViewUrl(reportFileUrl) {
  if (!reportFileUrl) return null;

  // Direct web URL with query token or external link
  if (
    (reportFileUrl.startsWith('http://') || reportFileUrl.startsWith('https://')) &&
    !reportFileUrl.includes('/storage/v1/object/public/lab_reports/')
  ) {
    return reportFileUrl;
  }

  if (!supabase) return reportFileUrl;

  try {
    // Extract relative storage path if full Supabase URL was passed
    let cleanPath = reportFileUrl;
    if (cleanPath.includes('/lab_reports/')) {
      cleanPath = cleanPath.split('/lab_reports/').pop();
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(cleanPath, 7200);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }

    // Fallback to public URL
    const { data: pubData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(cleanPath);

    return pubData?.publicUrl || reportFileUrl;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return reportFileUrl;
  }
}

/**
 * Open report document in a new browser tab
 * @param {string} reportFileUrl - Stored path or URL
 */
export async function openReportDocument(reportFileUrl) {
  if (!reportFileUrl) {
    alert('No attached document file found for this report.');
    return;
  }

  const url = await getReportViewUrl(reportFileUrl);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    alert('Unable to load document access link.');
  }
}
