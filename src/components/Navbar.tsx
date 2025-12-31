/**
 * Speckit Dashboard - Navbar Component
 * Top navigation with project dropdown and view links
 */

import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useTheme } from '../contexts/ThemeContext';
import ProjectConfigModal from './ProjectConfigModal';
import SyncButton from './SyncButton';

// Icons (inline SVG for independence)
const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export function Navbar() {
  const { activeProject, projects, selectProject, removeProject } = useProject();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Re-initialize Preline dropdowns when component updates
  useEffect(() => {
    if (window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  }, [projects, activeProject]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SK</span>
              </div>
              <span className="font-semibold text-lg text-gray-900 dark:text-white hidden sm:block">Speckit</span>
            </div>

            {/* Navigation Links */}
            <div className="flex gap-2 sm:gap-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
                title="Overview"
              >
                <ChartIcon />
                <span className="hidden md:inline">Overview</span>
              </NavLink>

              <NavLink
                to="/features"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
                title="Features"
              >
                <ListIcon />
                <span className="hidden md:inline">Features</span>
              </NavLink>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Project Selector Dropdown */}
              <div className="hs-dropdown relative inline-flex">
                <button
                  id="hs-dropdown-project"
                  type="button"
                  className="hs-dropdown-toggle inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors max-w-[200px] w-auto"
                >
                  <FolderIcon />
                  <span className="hidden sm:inline truncate">
                    {activeProject?.name || 'Select Project'}
                  </span>
                  <ChevronDownIcon />
                </button>

                <div
                  className="hs-dropdown-menu transition-[opacity,margin] duration-200 hs-dropdown-open:opacity-100 opacity-0 hidden min-w-[15rem] bg-white dark:bg-gray-800 shadow-md rounded-lg p-2 mt-2 border border-gray-200 dark:border-gray-700"
                  aria-labelledby="hs-dropdown-project"
                >
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeProject?.id === project.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <button
                        onClick={() => selectProject(project.id)}
                        className="flex-1 flex items-start gap-3 w-full"
                      >
                        <FolderIcon />
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium">{project.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {project.rootPath}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to remove this project from the list? Data will be preserved.')) {
                            removeProject(project.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove from list"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <PlusIcon />
                    <span>Add New Project</span>
                  </button>
                </div>
              </div>

              {/* Sync Button */}
              <SyncButton projectId={activeProject?.id || null} variant="minimal" />

              {/* Settings Link */}
              <NavLink
                to="/settings/ai"
                className={({ isActive }) =>
                  `inline-flex items-center justify-center w-9 h-9 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 transition-colors ${isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-300 dark:border-primary-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`
                }
                title="AI Settings"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </NavLink>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Project Config Modal */}
      <ProjectConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </>
  );
}

export default Navbar;
