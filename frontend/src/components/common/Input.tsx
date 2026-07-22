/**
 * Input Component
 * 
 * Form input with label, error state, and helper text.
 * 
 * @component Input
 */

import { cn } from '@/utils';
import { AlertCircle } from 'lucide-react';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
            {label}
            {props.required && <span className="text-restylee-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border-2 px-4 py-3 text-sm text-charcoal-900',
            'placeholder:text-charcoal-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-restylee-300 focus:border-restylee-400',
            error
              ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
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
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-charcoal-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
