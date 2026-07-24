/**
 * API Service
 * 
 * Handles all HTTP communication with the backend.
 * Uses axios for request/response handling.
 * 
 * @module services/api
 */

import axios, { AxiosError, type AxiosResponse } from 'axios';
import type { ApiResponse, Product } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://restylee-backend.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
// apiClient.interceptors.response.use(
//   (response: AxiosResponse) => response,
//   (error: AxiosError<ApiResponse<unknown>>) => {
//     const message = error.response?.data?.message || 'An unexpected error occurred';
//     const errors = error.response?.data?.errors || [message];

//     console.error('[API Error]', { message, errors, status: error.response?.status });
//     return Promise.reject({ message, errors, status: error.response?.status });
//   }
// );
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Full Axios Error:", error);

    if (error.response) {
      console.error("Response:", error.response);
    }

    if (error.request) {
      console.error("Request:", error.request);
    }

    console.error("Error JSON:", error.toJSON?.());

    return Promise.reject(error);
  }
);

/**
 * Product API endpoints
 */
export const productApi = {
  /**
   * Get all products
   */
  async getAllProducts(): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get('/api/products');
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data;
  },

  /**
   * Create a new product with images
   */
  async createProduct(
    name: string,
    description: string,
    images: File[]
  ): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);

    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await apiClient.post('/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete(`/api/products/${id}`);
    return response.data;
  },
};

export default apiClient;
