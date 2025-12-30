/**
 * IPC Service - Type-safe wrapper for Electron IPC calls
 * Provides centralized access to main process functionality
 */

import type { EntitiesListResponse, IPCResponse } from "../types/ipc";

/**
 * Entity Service - Operations for data model entities
 */
export const entityService = {
  /**
   * List all entities for a specific feature
   * @param featureId - Feature ID to fetch entities for
   * @returns Promise with entities array
   */
  async listEntities(
    featureId: number,
  ): Promise<IPCResponse<EntitiesListResponse>> {
    return window.electronAPI.listEntities(featureId);
  },
};

/**
 * Combined IPC service exports
 */
export const ipcService = {
  entities: entityService,
};

export default ipcService;
