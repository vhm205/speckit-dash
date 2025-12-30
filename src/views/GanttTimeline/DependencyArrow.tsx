/**
 * Speckit Dashboard - Dependency Arrow Component
 * SVG arrows connecting dependent tasks in Gantt timeline
 */

import { useEffect, useState } from 'react';

interface DependencyArrowProps {
  fromTaskId: string;
  toTaskId: string;
  color?: string;
}

interface ArrowPath {
  path: string;
  isValid: boolean;
}

/**
 * Calculate arrow path between two task elements
 */
function calculateArrowPath(
  fromId: string,
  toId: string
): ArrowPath {
  const fromEl = document.querySelector(`[data-task-id="${fromId}"]`);
  const toEl = document.querySelector(`[data-task-id="${toId}"]`);

  if (!fromEl || !toEl) {
    return { path: '', isValid: false };
  }

  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();
  const timeline = document.querySelector('[data-gantt-timeline]');
  const timelineRect = timeline?.getBoundingClientRect();

  if (!timelineRect) {
    return { path: '', isValid: false };
  }

  // Start from right-center of source task
  const startX = fromRect.right - timelineRect.left;
  const startY = fromRect.top + fromRect.height / 2 - timelineRect.top;

  // End at left-center of target task
  const endX = toRect.left - timelineRect.left;
  const endY = toRect.top + toRect.height / 2 - timelineRect.top;

  // Create curved path with bezier curve
  const controlPointOffset = Math.abs(endX - startX) / 3;
  const path = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;

  return { path, isValid: true };
}

export function DependencyArrow({
  fromTaskId,
  toTaskId,
  color = '#94a3b8',
}: DependencyArrowProps) {
  const [arrowPath, setArrowPath] = useState<ArrowPath>({ path: '', isValid: false });

  useEffect(() => {
    // Calculate path after DOM is ready
    const updatePath = () => {
      const newPath = calculateArrowPath(fromTaskId, toTaskId);
      setArrowPath(newPath);
    };

    // Wait for DOM to be fully rendered
    const timer = setTimeout(updatePath, 100);

    // Recalculate on window resize
    window.addEventListener('resize', updatePath);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePath);
    };
  }, [fromTaskId, toTaskId]);

  if (!arrowPath.isValid) return null;

  return (
    <g className="dependency-arrow">
      {/* Arrow line */}
      <path
        d={arrowPath.path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="4 4"
        markerEnd="url(#arrowhead)"
        className="transition-all duration-300"
      />
    </g>
  );
}

/**
 * SVG marker definitions for arrowheads
 */
export function DependencyArrowDefs() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
      </marker>
    </defs>
  );
}

export default DependencyArrow;

