/**
 * Button Component - Preline/Tailwind styled button
 */

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  onPress?: () => void;  // Compatibility with HeroUI prop name
  variant?: 'primary' | 'secondary' | 'flat' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isDisabled?: boolean;  // Compatibility with HeroUI prop name
  isIconOnly?: boolean;
  isLoading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white border-transparent shadow-sm hover:shadow-md hover:shadow-primary-500/30',
  secondary: 'bg-accent-600 hover:bg-accent-700 text-white border-transparent shadow-sm hover:shadow-md hover:shadow-accent-500/30',
  flat: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border-transparent',
  outline: 'bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const iconOnlySizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

export function Button({
  children,
  onClick,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  isDisabled = false,
  isIconOnly = false,
  isLoading = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const handleClick = onClick || onPress;
  const isDisabledState = disabled || isDisabled || isLoading;

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabledState}
      className={`
        inline-flex items-center justify-center gap-2 
        font-medium rounded-lg border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
        ${isIconOnly ? iconOnlySizeClasses[size] : sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
