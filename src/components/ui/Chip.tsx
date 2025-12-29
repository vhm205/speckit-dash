/**
 * Chip/Badge Component - Preline/Tailwind styled badge/chip
 */

import { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
  variant?: 'solid' | 'flat' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorClasses = {
  solid: {
    primary: 'bg-primary-600 text-white',
    secondary: 'bg-accent-600 text-white',
    success: 'bg-success-600 text-white',
    warning: 'bg-amber-500 text-white',
    danger: 'bg-red-600 text-white',
    default: 'bg-gray-600 text-white',
  },
  flat: {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
    secondary: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300',
    success: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  },
  bordered: {
    primary: 'border-2 border-primary-600 text-primary-600 dark:text-primary-400 bg-transparent',
    secondary: 'border-2 border-accent-600 text-accent-600 dark:text-accent-400 bg-transparent',
    success: 'border-2 border-success-600 text-success-600 dark:text-success-400 bg-transparent',
    warning: 'border-2 border-amber-500 text-amber-600 dark:text-amber-400 bg-transparent',
    danger: 'border-2 border-red-600 text-red-600 dark:text-red-400 bg-transparent',
    default: 'border-2 border-gray-600 text-gray-600 dark:text-gray-400 bg-transparent',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function Chip({
  children,
  color = 'default',
  variant = 'flat',
  size = 'md',
  className = '',
}: ChipProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center gap-1
        font-medium rounded-full whitespace-nowrap
        ${sizeClasses[size]}
        ${colorClasses[variant][color]}
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}

export default Chip;
