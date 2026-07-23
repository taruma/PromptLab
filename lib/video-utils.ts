export interface UploadedVideo {
  id: string;
  label: string;
  base64?: string;
  mimeType?: string;
  duration?: number;
  width?: number;
  height?: number;
  youtubeUrl?: string;
  isYouTube?: boolean;
}

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
  duration?: number;
  width?: number;
  height?: number;
  base64?: string;
}

/**
 * Validates whether a string is a valid YouTube URL.
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(trimmed);
}

/**
 * Extracts YouTube 11-character video ID from various YouTube URL formats.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Returns YouTube video thumbnail image URL for a given YouTube URL.
 */
export function getYouTubeThumbnailUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Validates a video file against specifications:
 * - Must be .mp4 format
 * - Duration must be <= 30 seconds
 * - File size must be <= 35 MB
 */
export async function validateAndProcessVideo(file: File): Promise<VideoValidationResult> {
  // Check extension / MIME type
  const isMp4Mime = file.type === "video/mp4" || file.type.includes("mp4");
  const isMp4Ext = file.name.toLowerCase().endsWith(".mp4");

  if (!isMp4Mime && !isMp4Ext) {
    return {
      valid: false,
      error: `File "${file.name}" is not an MP4 video. Only .mp4 files are supported.`,
    };
  }

  // Check file size limit (35 MB)
  const MAX_FILE_SIZE_BYTES = 35 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Video "${file.name}" is ${sizeMb} MB. Maximum allowed video size is 35 MB.`,
    };
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = video.duration;
      const height = video.videoHeight;
      const width = video.videoWidth;

      if (duration > 30) {
        resolve({
          valid: false,
          error: `Video "${file.name}" length is ${Math.round(duration)}s. Maximum allowed video length is 30 seconds.`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          valid: true,
          duration,
          width,
          height,
          base64: reader.result as string,
        });
      };
      reader.onerror = () => {
        resolve({
          valid: false,
          error: `Failed to read video file "${file.name}".`,
        });
      };
      reader.readAsDataURL(file);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: `Could not load video metadata for "${file.name}". Please ensure it is a valid MP4 video.`,
      });
    };

    video.src = url;
  });
}
