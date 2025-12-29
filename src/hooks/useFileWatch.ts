/**
 * Speckit Dashboard - useFileWatch Hook
 * React hook to listen for file change events from the main process
 */

import { useCallback, useEffect } from "react";
import type { FileChangeEvent } from "../types";

interface UseFileWatchOptions {
  /**
   * Callback when any file changes
   */
  onFileChange?: (event: FileChangeEvent) => void;
  /**
   * Filter to specific feature ID
   */
  featureId?: number;
  /**
   * Whether the hook is enabled
   */
  enabled?: boolean;
}

/**
 * Hook to subscribe to file change events from the Electron main process
 */
export function useFileWatch(options: UseFileWatchOptions = {}) {
  const { onFileChange, featureId, enabled = true } = options;

  const handleFileChange = useCallback(
    (event: FileChangeEvent) => {
      // If filtering by feature ID, check if the event matches
      if (featureId !== undefined && event.affectedFeatureId !== featureId) {
        return;
      }

      onFileChange?.(event);
    },
    [onFileChange, featureId],
  );

  useEffect(() => {
    if (!enabled || !window.electronAPI?.onFileChange) {
      return;
    }

    // Subscribe to file change events
    const unsubscribe = window.electronAPI.onFileChange(handleFileChange);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [enabled, handleFileChange]);
}

export default useFileWatch;
