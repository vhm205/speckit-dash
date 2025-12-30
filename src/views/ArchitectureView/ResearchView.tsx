/**
 * ResearchView Component
 * Displays research decisions alongside architecture diagram
 */

import { Card, CardBody, CardHeader } from '../../components/ui';
import type { ResearchDecision } from '../../types';

interface ResearchViewProps {
  decisions: ResearchDecision[];
  onClose?: () => void;
}

export function ResearchView({ decisions, onClose }: ResearchViewProps) {
  if (decisions.length === 0) {
    return null;
  }

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Research Decisions
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Decision Cards */}
      <div className="p-4 space-y-4">
        {decisions.map((decision) => (
          <Card key={decision.id} className="shadow-sm">
            <CardHeader className="pb-2">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                {decision.title}
              </h4>
            </CardHeader>
            <CardBody className="pt-2 space-y-2">
              {/* Decision */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Decision
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {decision.decision}
                </p>
              </div>

              {/* Rationale */}
              {decision.rationale && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Rationale
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {decision.rationale}
                  </p>
                </div>
              )}

              {/* Alternatives */}
              {decision.alternatives && decision.alternatives.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Alternatives Considered
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                    {decision.alternatives.map((alt, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        <span>{alt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Context */}
              {decision.context && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {decision.context}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ResearchView;
