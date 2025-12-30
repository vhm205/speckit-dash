/**
 * Entity Details Panel
 * Side panel showing detailed information about a selected entity
 */

import type { EntityDetail } from '../../hooks/useSchema';

interface EntityDetailsProps {
  entity: EntityDetail;
  onClose: () => void;
}

export function EntityDetails({ entity, onClose }: EntityDetailsProps) {
  return (
    <div className="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
            {entity.entityName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Description */}
        {entity.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {entity.description}
            </p>
          </div>
        )}

        {/* Source */}
        {entity.sourceFile && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Source
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-violet-600 dark:text-violet-400">
                {entity.sourceFile}
                {entity.lineNumber && `:${entity.lineNumber}`}
              </span>
            </div>
          </div>
        )}

        {/* Attributes */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Attributes ({entity.attributes.length})
          </h3>
          {entity.attributes.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              No attributes defined
            </p>
          ) : (
            <div className="space-y-2">
              {entity.attributes.map((attr, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {attr.name}
                    </span>
                    {attr.type && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        {attr.type}
                      </span>
                    )}
                  </div>
                  {attr.constraints && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                      {attr.constraints}
                    </p>
                  )}
                  {attr.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {attr.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relationships */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Relationships ({entity.relationships.length})
          </h3>
          {entity.relationships.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              No relationships defined
            </p>
          ) : (
            <div className="space-y-2">
              {entity.relationships.map((rel, index) => (
                <div
                  key={index}
                  className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="font-medium text-sm text-violet-700 dark:text-violet-300">
                      {rel.target}
                    </span>
                    {rel.type && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({rel.type})
                      </span>
                    )}
                  </div>
                  {rel.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {rel.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Validation Rules */}
        {entity.validationRules && entity.validationRules.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Validation Rules ({entity.validationRules.length})
            </h3>
            <div className="space-y-1">
              {entity.validationRules.map((rule, index) => (
                <div
                  key={index}
                  className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border-l-2 border-amber-400 dark:border-amber-600"
                >
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EntityDetails;
