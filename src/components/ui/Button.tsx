'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center font-accent font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-terracotta-500 text-white hover:bg-terracotta-600 focus:ring-terracotta-500 shadow-sm hover:shadow-md',
        secondary:
          'bg-deep-blue-500 text-white hover:bg-deep-blue-600 focus:ring-deep-blue-500 shadow-sm hover:shadow-md',
        outline:
          'border-2 border-deep-blue-500 text-deep-blue-600 bg-transparent hover:bg-deep-blue-50 focus:ring-deep-blue-500',
        'outline-white':
          'border-2 border-white text-white bg-transparent hover:bg-white/10 focus:ring-white',
        ghost:
          'text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-gray-500',
        link:
          'text-deep-blue-600 bg-transparent underline-offset-4 hover:underline focus:ring-deep-blue-500 p-0',
      },
      size: {
        sm: 'text-sm px-4 py-2 rounded-md',
        md: 'text-sm px-6 py-3 rounded-lg',
        lg: 'text-base px-8 py-4 rounded-lg',
        xl: 'text-lg px-10 py-5 rounded-xl',
        icon: 'p-2 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      uppercase: {
        true: 'uppercase tracking-wider text-[0.8em]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      uppercase: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      uppercase,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, uppercase, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !loading && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
