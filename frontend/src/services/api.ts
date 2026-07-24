/**
 * API Service
 *
 * Handles all HTTP communication with the backend.
 */

import axios from "axios";
import type { ApiResponse, Product } from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://restylee-backend.onrender.com/api";

  export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
    );
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("=========== API ERROR ===========");
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error("URL:", error.config?.url);
    console.error("Response:", error.response?.data);
    console.error("=================================");

    return Promise.reject(error);
  }
);

export const productApi = {
  // Get all products
  async getAllProducts(): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get("/products");
    return response.data;
  },

  // Get product by ID
  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Create product
  async createProduct(
    name: string,
    description: string,
    images: File[]
  ): Promise<ApiResponse<Product>> {
    const formData = new FormData();

    formData.append("name", name);
    formData.append("description", description);

    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await apiClient.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Delete product
  async deleteProduct(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};

export default apiClient;