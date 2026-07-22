/**
 * ProductForm Component
 * 
 * Form for creating new product listings with image upload,
 * validation, and submission handling.
 * 
 * @component ProductForm
 */

import { useState, useCallback } from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Alert } from '@/components/common/Alert';
import { ImageUploader } from './ImageUploader';
import { Package, Sparkles, AlertTriangle } from 'lucide-react';
import type { UploadStatus } from '@/types';

interface ProductFormProps {
  onSubmit: (name: string, description: string, images: File[]) => Promise<void>;
  isSubmitting: boolean;
}

export function ProductForm({ onSubmit, isSubmitting }: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<UploadStatus[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleImagesChange = useCallback((newImages: UploadStatus[]) => {
    setImages(newImages);
    // Clear errors when images change
    if (errors.length > 0) {
      setErrors([]);
    }
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setShowSuccess(false);

    // Client-side validation
    const validationErrors: string[] = [];

    if (!name.trim()) {
      validationErrors.push('Product name is required');
    } else if (name.trim().length > 100) {
      validationErrors.push('Product name must not exceed 100 characters');
    }

    if (!description.trim()) {
      validationErrors.push('Product description is required');
    } else if (description.trim().length > 2000) {
      validationErrors.push('Product description must not exceed 2000 characters');
    }

    // Check for personal info patterns in description
    const personalInfoPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
      /@[A-Za-z0-9_]{3,30}/,
      /https?:\/\/[^\s]+/i,
    ];

    for (const pattern of personalInfoPatterns) {
      if (pattern.test(description)) {
        validationErrors.push('Description contains personal information. Please remove emails, phone numbers, social media handles, or URLs.');
        break;
      }
    }

    const validImages = images.filter((img) => img.isValid !== false);
    if (validImages.length < 2) {
      validationErrors.push('At least 2 valid images are required');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const imageFiles = validImages.map((img) => img.file);
      await onSubmit(name.trim(), description.trim(), imageFiles);

      // Reset form on success
      setName('');
      setDescription('');
      setImages([]);
      setShowSuccess(true);

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: unknown) {
      const errorObj = err as { errors?: string[]; message?: string };
      const serverErrors = errorObj.errors || [errorObj.message || 'Failed to create product'];
      setErrors(serverErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-charcoal-100">
        <div className="bg-restylee-100 rounded-xl p-2.5">
          <Package className="h-5 w-5 text-restylee-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-charcoal-900">List Your Item</h2>
          <p className="text-sm text-charcoal-500">
            Share your fashion with the Restylee community
          </p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <Alert
          variant="success"
          title="Product Listed!"
          message="Your product has been successfully added to the marketplace."
          onDismiss={() => setShowSuccess(false)}
        />
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert
          variant="error"
          title="Please fix the following issues"
          message={errors.join('. ')}
          onDismiss={() => setErrors([])}
        />
      )}

      {/* Product Name */}
      <Input
        label="Product Name"
        placeholder="e.g., Vintage Denim Jacket"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={100}
        helperText="Give your item a clear, descriptive name"
      />

      {/* Product Description */}
      <Textarea
        label="Description"
        placeholder="Describe your item - condition, size, brand, material, and any unique features..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        maxLength={2000}
        rows={5}
        helperText="Be detailed but avoid including personal contact information"
      />

      {/* Image Upload */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-restylee-500" />
          <label className="text-sm font-semibold text-charcoal-800">
            Product Images
          </label>
          <span className="text-xs text-charcoal-400">(Required)</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 space-y-1">
            <p className="font-medium">Image requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-600">
              <li>Upload 2-5 images of your fashion item</li>
              <li>Images must contain fashion products (clothing, footwear, bags, accessories)</li>
              <li>No text overlays, watermarks, or captions on images</li>
              <li>Only JPG, JPEG, and PNG formats accepted</li>
              <li>Maximum 5MB per image</li>
            </ul>
          </div>
        </div>

        <ImageUploader
          images={images}
          onImagesChange={handleImagesChange}
          maxImages={5}
          minImages={2}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-charcoal-100">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting || images.filter((img) => img.isValid !== false).length < 2}
          className="w-full"
        >
          {isSubmitting ? 'Creating Listing...' : 'List Product'}
        </Button>
        <p className="text-xs text-charcoal-400 text-center mt-3">
          By listing, you agree to our community guidelines and verification process
        </p>
      </div>
    </form>
  );
}
