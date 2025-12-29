/**
 * Speckit Dashboard - Project Context
 * Global state management for active project and project list
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Project } from '../types';

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  selectProject: (projectId: number) => Promise<void>;
  configureProject: (rootPath: string) => Promise<Project | null>;
  removeProject: (projectId: number) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects on mount
  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.listProjects();
      if (response.success && response.data) {
        setProjects(response.data.projects);

        // Auto-select most recent project
        if (response.data.projects.length > 0 && !activeProject) {
          const lastProject = response.data.projects[0]; // Already sorted by last_opened_at
          setActiveProject(lastProject);
        }
      } else if (!response.success) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [activeProject]);

  // Select a project
  const selectProject = useCallback(async (projectId: number) => {
    try {
      setError(null);

      const response = await window.electronAPI.selectProject(projectId);
      if (response.success) {
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          setActiveProject(project);
          // Persist to localStorage
          localStorage.setItem('speckit-last-project', String(projectId));
        }
      } else if (!response.success) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select project');
    }
  }, [projects]);

  // Configure a new project
  const configureProject = useCallback(async (rootPath: string): Promise<Project | null> => {
    try {
      setError(null);

      const response = await window.electronAPI.configureProject(rootPath);
      if (response.success && response.data) {
        const newProject = response.data.project;

        // Update projects list
        setProjects((prev) => {
          const exists = prev.find((p) => p.id === newProject.id);
          if (exists) {
            return prev.map((p) => (p.id === newProject.id ? newProject : p));
          }
          return [newProject, ...prev];
        });

        // Select the new project
        setActiveProject(newProject);
        localStorage.setItem('speckit-last-project', String(newProject.id));

        return newProject;
      } else if (!response.success) {
        setError(response.error);
        return null;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure project');
      return null;
    }
  }, []);

  // Remove a project
  const removeProject = useCallback(async (projectId: number) => {
    try {
      setError(null);

      const response = await window.electronAPI.removeProject(projectId);
      if (response.success) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));

        // If active project was removed, clear it
        if (activeProject?.id === projectId) {
          setActiveProject(null);
          localStorage.removeItem('speckit-last-project');
        }
      } else if (!response.success) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove project');
    }
  }, [activeProject]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Restore last project from localStorage
  useEffect(() => {
    const lastProjectId = localStorage.getItem('speckit-last-project');
    if (lastProjectId && projects.length > 0 && !activeProject) {
      const project = projects.find((p) => p.id === Number(lastProjectId));
      if (project) {
        setActiveProject(project);
      }
    }
  }, [projects, activeProject]);

  const value: ProjectContextValue = {
    projects,
    activeProject,
    isLoading,
    error,
    loadProjects,
    selectProject,
    configureProject,
    removeProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
