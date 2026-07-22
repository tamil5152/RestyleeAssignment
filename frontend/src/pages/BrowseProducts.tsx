/**
 * BrowseProducts Page
 * 
 * Page for browsing all product listings.
 * 
 * @page BrowseProducts
 */

import { useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Loader2, Package, RefreshCw, ShoppingBag } from 'lucide-react';

export function BrowseProducts() {
  const { products, isLoading, error, fetchProducts, deleteProduct } = useProducts();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
    }
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 text-restylee-500 animate-spin" />
        <p className="text-charcoal-500 font-medium">Loading products...</p>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Alert
          variant="error"
          title="Failed to load products"
          message={error}
        />
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={fetchProducts}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-charcoal-100 rounded-full p-6 mb-6">
          <ShoppingBag className="h-12 w-12 text-charcoal-400" />
        </div>
        <h3 className="text-xl font-bold text-charcoal-900 mb-2">
          No products yet
        </h3>
        <p className="text-charcoal-500 max-w-md mb-6">
          Be the first to list an item on Restylee. Start selling your pre-loved or new fashion today!
        </p>
        <Button
          variant="primary"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          List Your First Item
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-restylee-100 rounded-xl p-2">
            <Package className="h-5 w-5 text-restylee-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-charcoal-900">Browse Listings</h2>
            <p className="text-sm text-charcoal-500">
              {products.length} {products.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchProducts}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
