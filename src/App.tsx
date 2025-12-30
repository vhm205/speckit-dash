/**
 * Speckit Dashboard - Main App Component
 * Root component with routing setup
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useProject } from './contexts/ProjectContext';
import { AIProviderProvider } from './contexts/AIProviderContext';
import StatsOverview from './views/StatsOverview';
import FeatureList from './views/FeatureList';
import KanbanBoard from './views/KanbanBoard';
import GanttTimeline from './views/GanttTimeline';
import FeatureSummaryView from './views/FeatureSummaryView';
import ArchitectureView from './views/ArchitectureView';
import AIAnalysis from './views/AIAnalysis';
import SchemaView from './views/SchemaView';
import AISettings from './components/AISettings';
import Navbar from './components/Navbar';
import ProjectConfigModal from './components/ProjectConfigModal';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { activeProject, isLoading, projects } = useProject();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" label="Loading Speckit Dashboard..." />
      </div>
    );
  }

  // Show project config modal if no projects configured
  const showConfigModal = projects.length === 0 || !activeProject;

  return (
    <AIProviderProvider>
      <div className="min-h-screen relative bg-gray-50 dark:bg-gray-900">
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Navigation */}
          <Navbar />

          {/* Main Content */}
          <main className="flex-1 pt-16 px-6 pb-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              <ErrorBoundary>
                <Routes>
                  {/* Stats Overview - Default route */}
                  <Route path="/" element={<StatsOverview />} />

                  {/* Feature List */}
                  <Route path="/features" element={<FeatureList />} />

                  {/* Kanban Board for a specific feature */}
                  <Route path="/features/:featureId/kanban" element={<KanbanBoard />} />

                  {/* Gantt Timeline for a specific feature */}
                  <Route path="/features/:featureId/gantt" element={<GanttTimeline />} />

                  {/* Summary View for a specific feature */}
                  <Route path="/features/:featureId/summary" element={<FeatureSummaryView />} />

                  {/* Architecture View for a specific feature */}
                  <Route path="/features/:featureId/architecture" element={<ArchitectureView />} />

                  {/* AI Analysis for a specific feature */}
                  <Route path="/features/:featureId/ai-analysis" element={<AIAnalysis />} />

                  {/* Schema View for a specific feature */}
                  <Route path="/features/:featureId/schema" element={<SchemaView />} />

                  {/* Settings - AI Configuration */}
                  <Route path="/settings/ai" element={<AISettings />} />

                  {/* Fallback redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </div>
          </main>

          {/* Project Configuration Modal */}
          <ProjectConfigModal isOpen={showConfigModal} onClose={() => { }} isRequired />
        </div>
      </div>
    </AIProviderProvider>
  );
}

export default App;

