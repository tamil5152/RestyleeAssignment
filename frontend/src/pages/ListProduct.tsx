/**
 * ListProduct Page
 * 
 * Page for creating new product listings.
 * 
 * @page ListProduct
 */

import { ProductForm } from '@/components/product/ProductForm';
import { useProducts } from '@/hooks/useProducts';
import { Toaster } from 'react-hot-toast';

export function ListProduct() {
  const { createProduct, isLoading } = useProducts();

  const handleSubmit = async (name: string, description: string, images: File[]) => {
    await createProduct(name, description, images);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 p-6 sm:p-8">
        <ProductForm onSubmit={handleSubmit} isSubmitting={isLoading} />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />
    </div>
  );
}
