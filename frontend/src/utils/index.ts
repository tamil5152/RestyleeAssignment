/**
 * Shared Utility Functions
 *
 * Common helpers used across components.
 *
 * @module utils
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

/**
 * Merge Tailwind class names, resolving conflicts sensibly.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string/Date into a readable label.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate text to a maximum length, adding an ellipsis if needed.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

/**
 * Format a file size in bytes into a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Create a local object-URL preview for an image file.
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Client-side pre-validation of an image file (type + size only;
 * deeper checks like fashion/text detection happen on the server).
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.type)) {
    return { isValid: false, error: 'Only JPG, JPEG, and PNG images are allowed.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'Image size must not exceed 5MB.' };
  }

  return { isValid: true };
}

const MIN_DIM = 200;
const MAX_DIM = 8000;

/**
 * Check image dimensions in the browser via the native Image element.
 * Runs entirely client-side in < 50ms — used by ImageUploader to show
 * valid/invalid feedback immediately on file selection, before the form
 * is submitted for full server-side validation.
 */
export function validateImageDimensions(
  file: File
): Promise<{ isValid: boolean; error?: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w < MIN_DIM || h < MIN_DIM) {
        resolve({
          isValid: false,
          error: `Image must be at least ${MIN_DIM}×${MIN_DIM}px (this image is ${w}×${h}px).`,
          width: w,
          height: h,
        });
      } else if (w > MAX_DIM || h > MAX_DIM) {
        resolve({
          isValid: false,
          error: `Image must not exceed ${MAX_DIM}×${MAX_DIM}px.`,
          width: w,
          height: h,
        });
      } else {
        resolve({ isValid: true, width: w, height: h });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ isValid: false, error: 'Cannot read image — file may be corrupted.' });
    };

    img.src = url;
  });
}

