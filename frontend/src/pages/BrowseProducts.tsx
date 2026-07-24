/**
 * BrowseProducts Page
 * 
 * Page for browsing all product listings.
 * Shows skeleton cards immediately while loading and a contextual
 * "waking up server" message on Render cold starts (> 3 s).
 * 
 * @page BrowseProducts
 */

import { useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Package, RefreshCw, ShoppingBag, Zap } from 'lucide-react';

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
// Mimics the ProductCard layout so the page feels populated instantly.
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-charcoal-200 bg-white overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="bg-charcoal-100 h-56 w-full" />
      <div className="p-4 space-y-3">
        {/* Name */}
        <div className="h-4 bg-charcoal-100 rounded w-3/4" />
        {/* Description lines */}
        <div className="h-3 bg-charcoal-100 rounded w-full" />
        <div className="h-3 bg-charcoal-100 rounded w-2/3" />
        {/* Footer row */}
        <div className="flex justify-between pt-2">
          <div className="h-3 bg-charcoal-100 rounded w-1/4" />
          <div className="h-3 bg-charcoal-100 rounded w-1/5" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Grid ─────────────────────────────────────────────────────────────
function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-charcoal-100 rounded-xl p-2 animate-pulse">
            <Package className="h-5 w-5 text-charcoal-200" />
          </div>
          <div className="space-y-1">
            <div className="h-4 bg-charcoal-100 rounded w-32 animate-pulse" />
            <div className="h-3 bg-charcoal-100 rounded w-20 animate-pulse" />
          </div>
        </div>
      </div>
      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function BrowseProducts() {
  const { products, isLoading, isWakingUp, error, fetchProducts, deleteProduct } = useProducts();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
    }
  };

  // Show skeleton grid immediately while loading — gives instant perceived
  // feedback instead of a blank/spinner screen.
  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-4">
        {/* Wake-up notice — only appears after 3 s (Render cold start) */}
        {isWakingUp && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Zap className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
            <span>
              <strong>Waking up the server…</strong> Render's free tier sleeps
              after 15 min of inactivity. This first load takes ~30 s — future
              visits will be instant.
            </span>
          </div>
        )}
        <SkeletonGrid count={6} />
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
