/**
 * Architecture Types
 * TypeScript interfaces for architecture analysis data
 */

export interface ArchitectureActor {
    id: string;
    label: string;
    type: 'user' | 'admin' | 'system_user' | 'external';
    description?: string;
}

export interface ArchitectureSystem {
    id: string;
    label: string;
    type: 'external' | 'internal' | 'module' | 'service';
    description?: string;
}

export interface ArchitectureProcess {
    id: string;
    label: string;
    description?: string;
}

export interface ArchitectureData {
    id: string;
    label: string;
    type: 'database' | 'cache' | 'storage' | 'queue';
    description?: string;
}

export interface ArchitectureConnection {
    id: string;
    from: string;
    to: string;
    label?: string;
    type?: 'data_flow' | 'control_flow' | 'interaction';
}

export interface ArchitectureResult {
    requestId: string;
    actors: ArchitectureActor[];
    systems: ArchitectureSystem[];
    processes: ArchitectureProcess[];
    dataStores: ArchitectureData[];
    connections: ArchitectureConnection[];
    duration: number;
    tokenCount?: number;
}
