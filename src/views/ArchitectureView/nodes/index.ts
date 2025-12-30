/**
 * Custom ReactFlow Nodes for Architecture View
 * Export all node types for use in architecture diagrams
 */

import ActorNode from './ActorNode';
import SystemNode from './SystemNode';
import ProcessNode from './ProcessNode';
import DataNode from './DataNode';

export { ActorNode, SystemNode, ProcessNode, DataNode };

// Node type mapping for ReactFlow
export const architectureNodeTypes = {
    actor: ActorNode,
    system: SystemNode,
    process: ProcessNode,
    data: DataNode,
};
