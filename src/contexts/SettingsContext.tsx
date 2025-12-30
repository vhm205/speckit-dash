/**
 * Speckit Dashboard - Settings Context
 * Management of application-wide settings (e.g., blur level)
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface SettingsContextValue {
  blurLevel: number;
  setBlurLevel: (level: number) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

const DEFAULT_BLUR = 10;

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [blurLevel, setBlurLevelState] = useState<number>(() => {
    const stored = localStorage.getItem('speckit-blur-level');
    return stored ? parseInt(stored, 10) : DEFAULT_BLUR;
  });

  const setBlurLevel = useCallback((level: number) => {
    setBlurLevelState(level);
    localStorage.setItem('speckit-blur-level', level.toString());
  }, []);

  const value: SettingsContextValue = {
    blurLevel,
    setBlurLevel,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
