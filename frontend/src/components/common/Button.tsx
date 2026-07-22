/**
 * Button Component
 * 
 * Reusable button with variants and states.
 * 
 * @component Button
 */

import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-restylee-600 text-white hover:bg-restylee-700 active:bg-restylee-800 shadow-sm',
    secondary: 'bg-charcoal-900 text-white hover:bg-charcoal-800 active:bg-charcoal-950 shadow-sm',
    outline: 'border-2 border-charcoal-200 text-charcoal-700 hover:border-restylee-400 hover:text-restylee-600 bg-white',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
    ghost: 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-restylee-400 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
