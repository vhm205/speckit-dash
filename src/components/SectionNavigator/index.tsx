/**
 * Section Navigator Component
 * Displays navigable sections extracted from specification files
 */

import { useState, useEffect } from 'react';
import { Card, CardBody } from '../ui';

/**
 * Section within a specification file
 */
export interface Section {
  heading: string;
  level: number;
  lineStart: number;
  lineEnd: number;
  children?: Section[];
}

interface SectionNavigatorProps {
  sections: Section[];
  onSectionClick?: (section: Section) => void;
  activeSection?: string;
  isLoading?: boolean;
  title?: string;
}

/**
 * Renders a hierarchical navigation tree for document sections
 */
export function SectionNavigator({
  sections,
  onSectionClick,
  activeSection,
  isLoading = false,
  title = 'Document Outline',
}: SectionNavigatorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Auto-expand sections containing the active section
  useEffect(() => {
    if (activeSection) {
      const expanded = new Set<string>();
      sections.forEach((section) => {
        if (section.heading === activeSection || section.children?.some(
          (child) => child.heading === activeSection
        )) {
          expanded.add(section.heading);
        }
      });
      setExpandedSections(expanded);
    }
  }, [activeSection, sections]);

  const toggleSection = (heading: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(heading)) {
        next.delete(heading);
      } else {
        next.add(heading);
      }
      return next;
    });
  };

  const renderSection = (section: Section, depth: number = 0) => {
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.heading);
    const isActive = activeSection === section.heading;

    return (
      <div key={`${section.heading}-${section.lineStart}`} className="w-full">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleSection(section.heading);
            }
            onSectionClick?.(section);
          }}
          className={`
            w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg
            transition-colors duration-150
            ${isActive
              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
          `}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {/* Expand/collapse indicator */}
          {hasChildren && (
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          {!hasChildren && <span className="w-4" />}

          {/* Section heading */}
          <span className="truncate">{section.heading}</span>

          {/* Line number indicator */}
          <span className="ml-auto text-xs text-gray-400">
            L{section.lineStart}
          </span>
        </button>

        {/* Children sections */}
        {hasChildren && isExpanded && (
          <div className="w-full">
            {section.children!.map((child) => renderSection(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 bg-gray-200 dark:bg-gray-700 rounded"
              />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (sections.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No sections found
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Section list */}
        <nav className="p-2 max-h-[400px] overflow-y-auto">
          {sections.map((section) => renderSection(section))}
        </nav>
      </CardBody>
    </Card>
  );
}

export default SectionNavigator;
