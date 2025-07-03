import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { sharedStyles, combineStyles } from '@/lib/sharedStyles';

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  tooltipText?: string;
}

export function AccessibleButton({
  children,
  ariaLabel,
  ariaDescribedBy,
  loading = false,
  loadingText = 'Loading...',
  icon,
  iconPosition = 'left',
  tooltipText,
  disabled,
  className,
  ...props
}: AccessibleButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Button
      className={combineStyles(
        // Ensure minimum touch target size (44px)
        'min-h-[44px] min-w-[44px]',
        // High contrast focus ring
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600',
        // Improved hover states
        'hover:shadow-sm transition-all duration-200',
        className
      )}
      disabled={isDisabled}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      title={tooltipText}
      {...props}
    >
      <span className="flex items-center gap-2">
        {loading && (
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span aria-hidden="true">{icon}</span>
        )}
        <span className={loading ? 'sr-only' : undefined}>
          {loading ? loadingText : children}
        </span>
        {!loading && icon && iconPosition === 'right' && (
          <span aria-hidden="true">{icon}</span>
        )}
      </span>
    </Button>
  );
}