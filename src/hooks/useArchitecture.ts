/**
 * Architecture Analysis Hook
 * Custom hook for triggering AI-powered architecture analysis
 */

import { useCallback, useState } from 'react';
import type { ArchitectureResult } from '../types/architecture';

interface UseArchitectureReturn {
    isLoading: boolean;
    error: string | null;
    data: ArchitectureResult | null;
    analyzeArchitecture: (featureId: number, force?: boolean) => Promise<ArchitectureResult | null>;
    clearError: () => void;
}

export function useArchitecture(): UseArchitectureReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ArchitectureResult | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const analyzeArchitecture = useCallback(
        async (featureId: number, force: boolean = false): Promise<ArchitectureResult | null> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await window.electronAPI.analyzeArchitecture(featureId, force);

                if (response.success && response.data) {
                    setData(response.data as ArchitectureResult);
                    return response.data as ArchitectureResult;
                }

                const errorMessage = 'error' in response ? response.error : 'Failed to analyze architecture';
                setError(errorMessage);
                return null;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Architecture analysis failed';
                setError(errorMessage);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    return {
        isLoading,
        error,
        data,
        analyzeArchitecture,
        clearError,
    };
}

export default useArchitecture;
