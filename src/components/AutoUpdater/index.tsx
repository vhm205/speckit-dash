/**
 * Auto-Update Component
 * Handles update notifications and user interactions
 */

import { useEffect, useState } from 'react';
import { Button } from '../ui';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
}

export function AutoUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    // Listen for update events from main process
    const handleUpdateAvailable = (...args: unknown[]) => {
      const info = args[1] as UpdateInfo;
      setUpdateAvailable(true);
      setUpdateInfo(info);
    };

    const handleDownloadProgress = (...args: unknown[]) => {
      const progress = args[1] as DownloadProgress;
      setDownloadProgress(Math.round(progress.percent));
    };

    const handleUpdateDownloaded = (..._args: unknown[]) => {
      setDownloading(false);
      setUpdateDownloaded(true);
    };

    // Register listeners
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('update-available', handleUpdateAvailable);
      window.electron.ipcRenderer.on('download-progress', handleDownloadProgress);
      window.electron.ipcRenderer.on('update-downloaded', handleUpdateDownloaded);
    }

    // Cleanup
    return () => {
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.removeAllListeners('update-available');
        window.electron.ipcRenderer.removeAllListeners('download-progress');
        window.electron.ipcRenderer.removeAllListeners('update-downloaded');
      }
    };
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    setUpdateAvailable(false);
    // Note: You'll need to add IPC handler for this
    window.electron?.ipcRenderer.send('download-update');
  };

  const handleInstallNow = () => {
    // Note: You'll need to add IPC handler for this
    window.electron?.ipcRenderer.send('install-update');
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    setUpdateDownloaded(false);
  };

  if (downloading) {
    return (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-sm border border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Downloading Update
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {downloadProgress}% complete
            </p>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (updateDownloaded) {
    return (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-sm border border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Update Ready to Install
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Restart the application to install the update
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstallNow}
              >
                Restart Now
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDismiss}
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (updateAvailable && updateInfo) {
    return (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-sm border border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Update Available
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Version {updateInfo.version} is now available
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownload}
              >
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default AutoUpdater;
