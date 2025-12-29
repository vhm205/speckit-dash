/**
 * Speckit Dashboard - Provider Wrapper
 * Combines all context providers for the application
 */

import { ReactNode } from 'react';
import { ProjectProvider } from '../contexts/ProjectContext';
import { ThemeProvider } from '../contexts/ThemeContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <ProjectProvider>{children}</ProjectProvider>
    </ThemeProvider>
  );
}

export default Providers;
