/**
 * Alert Component
 * 
 * Displays status messages with appropriate styling.
 * 
 * @component Alert
 */

import { cn } from '@/utils';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  message,
  onDismiss,
  className,
}: AlertProps) {
  const variants = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: 'text-emerald-500',
      Icon: CheckCircle,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
      Icon: XCircle,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: 'text-amber-500',
      Icon: AlertTriangle,
    },
    info: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-800',
      icon: 'text-sky-500',
      Icon: Info,
    },
  };

  const { bg, border, text, icon, Icon } = variants[variant];

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 animate-fade-in',
        bg,
        border,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', icon)} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('font-semibold text-sm mb-1', text)}>
              {title}
            </h4>
          )}
          <p className={cn('text-sm leading-relaxed', text)}>{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'shrink-0 rounded-lg p-1 transition-colors',
              `hover:${bg} hover:opacity-70`,
              text
            )}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
