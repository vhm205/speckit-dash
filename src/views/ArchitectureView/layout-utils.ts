/**
 * Layout Utilities - Auto-layout using Dagre algorithm
 * Provides hierarchical node positioning for entity diagrams
 */

import dagre from "dagre";
import type { Edge, Node } from "reactflow";

export interface LayoutOptions {
  direction?: "TB" | "LR" | "BT" | "RL";
  nodeWidth?: number;
  nodeHeight?: number;
  nodeSeparation?: number;
  rankSeparation?: number;
}

const defaultOptions: Required<LayoutOptions> = {
  direction: "TB",
  nodeWidth: 280,
  nodeHeight: 200,
  nodeSeparation: 80,
  rankSeparation: 150,
};

/**
 * Calculate automatic layout for nodes and edges using Dagre
 * @param nodes - ReactFlow nodes to layout
 * @param edges - ReactFlow edges connecting nodes
 * @param options - Layout configuration options
 * @returns Positioned nodes and edges
 */
export function getLayoutedElements<T = any>(
  nodes: Node<T>[],
  edges: Edge[],
  options: LayoutOptions = {},
): { nodes: Node<T>[]; edges: Edge[] } {
  const opts = { ...defaultOptions, ...options };

  // Create new directed graph
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));

  // Set graph layout options
  graph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSeparation,
    ranksep: opts.rankSeparation,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to graph
  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(graph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}

/**
 * Re-layout existing nodes and edges
 * Convenience function for re-calculating layout with different options
 */
export function relayout<T = any>(
  nodes: Node<T>[],
  edges: Edge[],
  direction: LayoutOptions["direction"] = "TB",
): { nodes: Node<T>[]; edges: Edge[] } {
  return getLayoutedElements(nodes, edges, { direction });
}

export default getLayoutedElements;
