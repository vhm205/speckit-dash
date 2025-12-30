import { useEffect, useState } from 'react';
import { Card, Button } from './ui';
import LoadingSpinner from './LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';

interface MarkdownContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureId: number;
  fileType: "spec" | "plan" | "tasks" | "data-model" | "requirements";
  fileName: string;
}

export function MarkdownContentModal({
  isOpen,
  onClose,
  featureId,
  fileType,
  fileName
}: MarkdownContentModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen, featureId, fileType]);

  const loadContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await window.electronAPI.readSpecFile(featureId, fileType);
      if (response && response.success && response.data) {
        setContent(response.data.content);
      } else {
        setError((response as any).error || 'Failed to read file content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/70"
        onClick={onClose}
      />

      {/* Modal Content */}
      <Card className="relative w-full max-w-5xl max-h-[90vh] flex flex-col shadow-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {fileName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {viewMode === 'preview' ? 'Markdown Preview' : 'Raw Source Content'}
              </p>
            </div>

            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg ml-4">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${viewMode === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('source')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${viewMode === 'source'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Source
              </button>
            </div>
          </div>

          <Button isIconOnly variant="flat" size="sm" onClick={onClose} aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-950/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner size="lg" label="Reading file..." />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 m-6 rounded-xl border border-red-100 dark:border-red-900/50">
              <p>{error}</p>
              <Button size="sm" variant="flat" onClick={loadContent} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="p-6 sm:p-10">
              {viewMode === 'source' ? (
                <pre className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                  {content}
                </pre>
              ) : (
                <div className="prose prose-violet dark:prose-invert max-w-none bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-lg border border-gray-200 dark:border-gray-800">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  >
                    {content || ''}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-white dark:bg-gray-900">
          <Button variant="flat" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default MarkdownContentModal;
