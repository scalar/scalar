import type { InMemoryWorkspace } from '@/schemas/inmemory-workspace'

/**
 * Represents a state change event in the workspace.
 * This can be triggered for changes to documents, configs, meta, and overrides.
 * The union covers each workspace property that, when changed, can notify plugins/reactive logic.
 *
 * - 'documents', 'originalDocuments', 'intermediateDocuments', 'documentConfigs', 'overrides', 'documentMeta':
 *      All provide the changed document's name and its new value.
 * - 'meta': Provides the new meta value for the workspace.
 */
export type WorkspaceStateChangeEvent =
  | {
      type: 'documents'
      documentName: string
      value: InMemoryWorkspace['documents'][string]
    }
  | {
      type: 'originalDocuments'
      documentName: string
      value: InMemoryWorkspace['originalDocuments'][string]
    }
  | {
      type: 'intermediateDocuments'
      documentName: string
      value: InMemoryWorkspace['intermediateDocuments'][string]
    }
  | {
      type: 'documentConfigs'
      documentName: string
      value: InMemoryWorkspace['documentConfigs'][string]
    }
  | {
      type: 'overrides'
      documentName: string
      value: InMemoryWorkspace['overrides'][string]
    }
  | {
      type: 'documentMeta'
      documentName: string
      value: InMemoryWorkspace['documentMeta'][string]
    }
  | {
      type: 'meta'
      value: InMemoryWorkspace['meta']
    }

/**
 * Plugin type for extending workspace-store behavior with hooks.
 *
 * - hooks.onWorkspaceStateChanges: Optional hook called when workspace state changes.
 */
export type WorkspacePlugin = Partial<{
  hooks: Partial<{
    /**
     * Called when the workspace state changes (documents, configs, metadata etc).
     * @param event Detailed info about the state change.
     */
    onWorkspaceStateChanges: (event: WorkspaceStateChangeEvent) => void
  }>
}>
