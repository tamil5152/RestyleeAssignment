/**
 * ImageUploader Component
 * 
 * Handles image upload with drag-and-drop, preview,
 * validation, and status indicators.
 * 
 * @component ImageUploader
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn, createImagePreview, formatFileSize, validateImageFile } from '@/utils';
import { Upload, X, ImageIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { UploadStatus } from '@/types';

interface ImageUploaderProps {
  images: UploadStatus[];
  onImagesChange: (images: UploadStatus[]) => void;
  maxImages?: number;
  minImages?: number;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  minImages = 2,
}: ImageUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) return;

      const filesToProcess = acceptedFiles.slice(0, remainingSlots);
      setIsProcessing(true);

      const newImages: UploadStatus[] = [];

      for (const file of filesToProcess) {
        // Client-side pre-validation
        const preValidation = validateImageFile(file);

        if (!preValidation.isValid) {
          newImages.push({
            file,
            preview: '',
            isValidating: false,
            isValid: false,
            errors: [preValidation.error!],
          });
          continue;
        }

        try {
          const preview = await createImagePreview(file);
          newImages.push({
            file,
            preview,
            isValidating: false,
            isValid: null,
            errors: [],
          });
        } catch {
          newImages.push({
            file,
            preview: '',
            isValidating: false,
            isValid: false,
            errors: ['Failed to process image'],
          });
        }
      }

      onImagesChange([...images, ...newImages]);
      setIsProcessing(false);
    },
    [images, maxImages, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: maxImages - images.length,
    disabled: images.length >= maxImages || isProcessing,
    noClick: images.length >= maxImages,
  });

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  const canAddMore = images.length < maxImages;
  const hasMinimum = images.length >= minImages;
  const validImages = images.filter((img) => img.isValid !== false);

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={cn(
            'relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer',
            'transition-all duration-300 ease-out',
            isDragActive && !isDragReject
              ? 'border-restylee-400 bg-restylee-50 scale-[1.02]'
              : isDragReject
              ? 'border-red-400 bg-red-50'
              : 'border-charcoal-300 bg-charcoal-50 hover:border-restylee-300 hover:bg-restylee-50/30',
            isProcessing && 'opacity-60 cursor-wait'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'rounded-full p-3 transition-colors',
                isDragActive ? 'bg-restylee-100' : 'bg-charcoal-100'
              )}
            >
              <Upload
                className={cn(
                  'h-6 w-6',
                  isDragActive ? 'text-restylee-600' : 'text-charcoal-500'
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal-700">
                {isDragActive
                  ? 'Drop images here...'
                  : 'Drag & drop images here'}
              </p>
              <p className="text-xs text-charcoal-500 mt-1">
                or click to browse files
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-charcoal-400">
              <span className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                JPG, JPEG, PNG
              </span>
              <span>Max 5MB each</span>
            </div>
          </div>
        </div>
      )}

      {/* Image Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-charcoal-700">
            Images
          </span>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              hasMinimum
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            )}
          >
            {images.length} / {maxImages}
          </span>
        </div>
        {!hasMinimum && images.length > 0 && (
          <span className="text-xs text-amber-600">
            At least {minImages} images required
          </span>
        )}
      </div>

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <ImagePreviewCard
              key={`${image.file.name}-${index}`}
              image={image}
              index={index}
              onRemove={removeImage}
            />
          ))}
        </div>
      )}

      {/* Validation Summary */}
      {validImages.length > 0 && validImages.length === images.length && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>All {images.length} images ready for submission</span>
        </div>
      )}
    </div>
  );
}

/**
 * Individual image preview card
 */
function ImagePreviewCard({
  image,
  index,
  onRemove,
}: {
  image: UploadStatus;
  index: number;
  onRemove: (index: number) => void;
}) {
  return (
    <div
      className={cn(
        'relative group rounded-xl overflow-hidden border-2 transition-all duration-200',
        image.isValid === false
          ? 'border-red-300 bg-red-50'
          : image.isValid === true
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-charcoal-200 bg-charcoal-100'
      )}
    >
      {/* Image Preview */}
      {image.preview ? (
        <div className="aspect-square relative">
          <img
            src={image.preview}
            alt={`Preview ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => onRemove(index)}
              className="bg-white/90 hover:bg-white text-red-600 rounded-full p-2 transition-colors"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="aspect-square flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-charcoal-300" />
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-2 right-2">
        {image.isValidating ? (
          <div className="bg-white/90 backdrop-blur rounded-full p-1.5">
            <Loader2 className="h-3.5 w-3.5 text-restylee-500 animate-spin" />
          </div>
        ) : image.isValid === false ? (
          <div className="bg-red-500 text-white rounded-full p-1">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
        ) : image.isValid === true ? (
          <div className="bg-emerald-500 text-white rounded-full p-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
        ) : null}
      </div>

      {/* File Info */}
      <div className="p-2.5 bg-white/80 backdrop-blur">
        <p className="text-xs font-medium text-charcoal-700 truncate">
          {image.file.name}
        </p>
        <p className="text-xs text-charcoal-400">
          {formatFileSize(image.file.size)}
        </p>
      </div>

      {/* Error Messages */}
      {image.errors.length > 0 && (
        <div className="p-2.5 bg-red-50 border-t border-red-100">
          {image.errors.map((error, i) => (
            <p key={i} className="text-xs text-red-600 flex items-start gap-1">
              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
