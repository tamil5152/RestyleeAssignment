/**
 * API Service
 *
 * Handles all HTTP communication with the backend.
 * Also runs a background keep-alive pinger so Render's free-tier
 * instance never spins down between user visits.
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

// ─── Keep-Alive Pinger ────────────────────────────────────────────────────────
// Render free-tier instances spin down after ~15 minutes of inactivity.
// The first request after a cold start takes 25-50 seconds, which breaks
// the ≤5 second SLA. We prevent that by pinging the lightweight
// /api/health/ping endpoint every 10 minutes, silently in the background.
// This has zero UI impact – errors are swallowed intentionally.

const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function pingBackend(): void {
  axios
    .get(`${API_BASE_URL}/health/ping`, { timeout: 10000 })
    .then(() => console.log("[keep-alive] Backend pinged successfully"))
    .catch(() => {
      /* Silent – server may be mid-sleep; next ping will catch it */
    });
}

// Fire once immediately when the app loads (warms up any sleeping instance),
// then repeat every 10 minutes.
pingBackend();
setInterval(pingBackend, KEEP_ALIVE_INTERVAL_MS);

// ─── Axios Interceptors ───────────────────────────────────────────────────────

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

// ─── API Methods ──────────────────────────────────────────────────────────────

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