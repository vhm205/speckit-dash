/**
 * Speckit Dashboard - Provider Wrapper
 * Combines all context providers for the application
 */

import { ReactNode } from 'react';
import { ProjectProvider } from '../contexts/ProjectContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SettingsProvider } from '../contexts/SettingsContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ProjectProvider>{children}</ProjectProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default Providers;

