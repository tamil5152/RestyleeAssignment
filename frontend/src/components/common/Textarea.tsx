/**
 * Textarea Component
 * 
 * Multi-line text input with character counter and success/error state.
 * Supports inline field-level validation feedback (shown on blur).
 * 
 * @component Textarea
 */

import { cn } from '@/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** When set, shows a green success border + checkmark message */
  success?: string;
  helperText?: string;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, success, helperText, maxLength, className, value, ...props }, ref) => {
    const currentLength = (value as string)?.length || 0;
    const isNearLimit = maxLength && currentLength > maxLength * 0.9;
    const isOverLimit = maxLength && currentLength > maxLength;

    const hasError = Boolean(error) || Boolean(isOverLimit);
    const hasSuccess = Boolean(success) && !hasError;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label className="text-sm font-semibold text-charcoal-800">
              {label}
              {props.required && <span className="text-restylee-500 ml-1">*</span>}
            </label>
          )}
          {maxLength && (
            <span
              className={cn(
                'text-xs font-medium',
                isOverLimit
                  ? 'text-red-500'
                  : isNearLimit
                  ? 'text-amber-500'
                  : 'text-charcoal-400'
              )}
            >
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn(
            'w-full rounded-xl border-2 px-4 py-3 text-sm text-charcoal-900',
            'placeholder:text-charcoal-400',
            'transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-restylee-300 focus:border-restylee-400',
            hasError
              ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
              : hasSuccess
              ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-200 focus:border-emerald-400'
              : 'border-charcoal-200 bg-white hover:border-charcoal-300',
            className
          )}
          {...props}
        />
        {error && (
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {hasSuccess && (
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {helperText && !hasError && !hasSuccess && (
          <p className="mt-1.5 text-sm text-charcoal-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
