/**
 * Speckit Dashboard - Project Config Modal
 * Modal for configuring Spec-kit project paths
 */

import { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';

interface ProjectConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRequired?: boolean;
}

// Icons
const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function ProjectConfigModal({ isOpen, onClose, isRequired = false }: ProjectConfigModalProps) {
  const { configureProject, error: contextError } = useProject();
  const [path, setPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Re-initialize Preline when modal opens
    if (isOpen && window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!path.trim()) {
      setError('Please enter a project path');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await configureProject(path.trim());
      if (result) {
        setSuccess(true);
        setPath('');
        // Close after success if not required
        if (!isRequired) {
          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 1000);
        }
      } else if (contextError) {
        setError(contextError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={isRequired ? undefined : onClose}
      ></div>

      {/* Modal */}
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configure Project</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter the path to your Spec-kit project directory
              </p>
            </div>
            {!isRequired && (
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Path Input */}
            <div>
              <label htmlFor="project-path" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Path
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <FolderIcon />
                </div>
                <input
                  id="project-path"
                  type="text"
                  value={path}
                  onChange={(e) => {
                    setPath(e.target.value);
                    setError(null);
                    setSuccess(false);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., /home/user/projects/my-project"
                  className={`block w-full pl-10 pr-4 py-2.5 text-sm font-mono rounded-lg border ${error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-offset-0 transition-colors`}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Supports both Windows (C:\Users\username\project) and Unix (/home/user/project) paths
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 whitespace-pre-line">{error}</p>
              )}
            </div>

            {/* Requirements */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Requirements:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  Contains <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">.specify/</code> folder
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  Contains <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">specs/</code> folder with feature specs
                </li>
              </ul>
            </div>

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 rounded-lg">
                <CheckIcon />
                <span className="text-sm font-medium">Project configured successfully!</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                <AlertIcon />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            {!isRequired && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!path.trim() || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors inline-flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Configure Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectConfigModal;
