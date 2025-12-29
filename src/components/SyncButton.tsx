/**
 * Speckit Dashboard - Sync Button Component
 * Manual sync button for updating project data from markdown files
 */

import { useState } from 'react';

// Icon components
const RefreshIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const AlertIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

interface SyncButtonProps {
    projectId: number | null;
    onSyncComplete?: () => void;
    className?: string;
    variant?: 'default' | 'minimal';
}

export function SyncButton({ projectId, onSyncComplete, className = "", variant = 'default' }: SyncButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSync = async () => {
        if (!projectId) return;

        setIsLoading(true);
        setError(null);
        setShowSuccess(false);

        try {
            const result = await window.electronAPI.syncProject(projectId);

            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);

                // Call callback if provided
                if (onSyncComplete) {
                    onSyncComplete();
                }
            } else {
                setError(result.error || 'Sync failed');
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === 'minimal') {
        return (
            <div className="relative">
                <button
                    onClick={handleSync}
                    disabled={!projectId || isLoading}
                    className={`inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                    title="Sync project data"
                >
                    <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                {/* Success/Error Toasts */}
                {showSuccess && (
                    <div className="absolute top-full mt-2 right-0 z-50 flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg shadow-lg whitespace-nowrap">
                        <CheckIcon />
                        <span className="text-sm font-medium">Synced successfully</span>
                    </div>
                )}

                {error && (
                    <div className="absolute top-full mt-2 right-0 z-50 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg shadow-lg max-w-xs">
                        <AlertIcon />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={handleSync}
                disabled={!projectId || isLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            >
                <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Success/Error Toasts */}
            {showSuccess && (
                <div className="absolute top-full mt-2 left-0 z-50 flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg shadow-lg">
                    <CheckIcon />
                    <span className="text-sm font-medium">Project synced successfully</span>
                </div>
            )}

            {error && (
                <div className="absolute top-full mt-2 left-0 z-50 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg shadow-lg max-w-sm">
                    <AlertIcon />
                    <span className="text-sm">{error}</span>
                </div>
            )}
        </div>
    );
}

export default SyncButton;
