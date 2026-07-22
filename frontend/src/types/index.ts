/**
 * Shared Type Definitions
 *
 * Central location for types used across the frontend.
 *
 * @module types
 */

export interface ProductImage {
  originalName: string;
  filename: string;
  thumbnail?: string;
  url: string;
  thumbnailUrl?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  count?: number;
}

export interface UploadStatus {
  file: File;
  preview: string;
  isValidating: boolean;
  isValid: boolean | null;
  errors: string[];
}
