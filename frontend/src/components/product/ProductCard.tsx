/**
 * ProductCard Component
 * 
 * Displays a single product with image gallery and details.
 * 
 * @component ProductCard
 */

import { useState } from 'react';
import { cn, formatDate, truncateText } from '@/utils';
import { ChevronLeft, ChevronRight, Trash2, Calendar, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;
}

export function ProductCard({ product, onDelete }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasMultipleImages = product.images.length > 1;
  const currentImage = product.images[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  return (
    <article className="group bg-white rounded-2xl border border-charcoal-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-slide-up">
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] bg-charcoal-100 overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage.url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-charcoal-300" />
          </div>
        )}

        {/* Image Navigation */}
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-charcoal-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-charcoal-700" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all duration-200',
                    i === currentImageIndex
                      ? 'bg-white w-4'
                      : 'bg-white/60 hover:bg-white/80'
                  )}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Image Count Badge */}
        {product.images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white text-xs font-medium px-2 py-1 rounded-lg">
            {currentImageIndex + 1} / {product.images.length}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-charcoal-900 mb-2 line-clamp-1">
          {product.name}
        </h3>

        <div className="relative">
          <p
            className={cn(
              'text-sm text-charcoal-600 leading-relaxed',
              !isExpanded && 'line-clamp-3'
            )}
          >
            {isExpanded ? product.description : truncateText(product.description, 150)}
          </p>
          {product.description.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-restylee-600 hover:text-restylee-700 mt-1"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-charcoal-100">
          <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(product.createdAt)}</span>
          </div>

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(product.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
