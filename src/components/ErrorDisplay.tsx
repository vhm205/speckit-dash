/**
 * Error Display Component
 * Displays user-friendly error messages with retry and guidance options
 */

import { Card, CardBody, Button } from './ui';

/**
 * Error types for categorization and display
 */
export type ErrorType =
  | 'invalid_path'
  | 'no_specs'
  | 'parse_error'
  | 'permission_denied'
  | 'network_error'
  | 'ai_error'
  | 'unknown';

interface ErrorDisplayProps {
  error: string;
  errorType?: ErrorType;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

/**
 * Error configuration for different error types
 */
const errorConfig: Record<ErrorType, {
  icon: JSX.Element;
  defaultTitle: string;
  suggestion: string;
  color: string;
}> = {
  invalid_path: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    defaultTitle: 'Invalid Project Path',
    suggestion: 'Please verify the path exists and contains a Spec-kit project structure.',
    color: 'amber',
  },
  no_specs: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    defaultTitle: 'No Specifications Found',
    suggestion: 'This project has no specification files. Create a specs/ folder with feature directories (e.g., 001-feature-name/).',
    color: 'blue',
  },
  parse_error: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    defaultTitle: 'File Parse Error',
    suggestion: 'The specification file has invalid formatting. Check the markdown syntax is correct.',
    color: 'orange',
  },
  permission_denied: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    defaultTitle: 'Permission Denied',
    suggestion: 'Unable to access the project folder. Check folder permissions and try again.',
    color: 'red',
  },
  network_error: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
    defaultTitle: 'Network Error',
    suggestion: 'Check your internet connection and try again.',
    color: 'gray',
  },
  ai_error: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    defaultTitle: 'AI Service Error',
    suggestion: 'The AI service is unavailable. Check your API configuration or try again later.',
    color: 'purple',
  },
  unknown: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    defaultTitle: 'Error',
    suggestion: 'An unexpected error occurred. Please try again.',
    color: 'red',
  },
};

/**
 * Get color classes based on error color
 */
function getColorClasses(color: string): {
  bg: string;
  iconBg: string;
  iconText: string;
  border: string;
} {
  const colorMap: Record<string, { bg: string; iconBg: string; iconText: string; border: string }> = {
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconText: 'text-amber-500',
      border: 'border-amber-200 dark:border-amber-800',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconText: 'text-blue-500',
      border: 'border-blue-200 dark:border-blue-800',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      iconText: 'text-orange-500',
      border: 'border-orange-200 dark:border-orange-800',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconText: 'text-red-500',
      border: 'border-red-200 dark:border-red-800',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      iconBg: 'bg-gray-100 dark:bg-gray-900/40',
      iconText: 'text-gray-500',
      border: 'border-gray-200 dark:border-gray-800',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconText: 'text-purple-500',
      border: 'border-purple-200 dark:border-purple-800',
    },
  };
  return colorMap[color] || colorMap.red;
}

/**
 * Error Display component with contextual styling and actions
 */
export function ErrorDisplay({
  error,
  errorType = 'unknown',
  title,
  onRetry,
  onDismiss,
  showDetails = true,
}: ErrorDisplayProps) {
  const config = errorConfig[errorType];
  const colors = getColorClasses(config.color);

  return (
    <Card className={`${colors.bg} ${colors.border} border`}>
      <CardBody className="py-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${colors.iconBg} ${colors.iconText} flex items-center justify-center`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || config.defaultTitle}
            </h3>

            {showDetails && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {error}
              </p>
            )}

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {config.suggestion}
            </p>

            {/* Actions */}
            {(onRetry || onDismiss) && (
              <div className="mt-4 flex gap-3">
                {onRetry && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onRetry}
                  >
                    Try Again
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onDismiss}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default ErrorDisplay;
