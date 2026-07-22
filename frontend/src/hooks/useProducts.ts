/**
 * useProducts Hook
 * 
 * Custom hook for managing product data and operations.
 * 
 * @module hooks/useProducts
 */

import { useState, useCallback } from 'react';
import { productApi } from '@/services/api';
import type { Product, ApiResponse } from '@/types';

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  createProduct: (
    name: string,
    description: string,
    images: File[]
  ) => Promise<ApiResponse<Product>>;
  deleteProduct: (id: string) => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productApi.getAllProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (err: unknown) {
      const errorObj = err as { message: string };
      setError(errorObj.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = useCallback(
    async (
      name: string,
      description: string,
      images: File[]
    ): Promise<ApiResponse<Product>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await productApi.createProduct(name, description, images);
        if (response.success && response.data) {
          setProducts((prev) => [response.data!, ...prev]);
        }
        return response;
      } catch (err: unknown) {
        const errorObj = err as { message: string; errors?: string[] };
        setError(errorObj.message || 'Failed to create product');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await productApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const errorObj = err as { message: string };
      setError(errorObj.message || 'Failed to delete product');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    createProduct,
    deleteProduct,
  };
}
