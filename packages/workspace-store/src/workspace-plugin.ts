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
      path: string[]
    }
  | {
      type: 'originalDocuments'
      documentName: string
      value: InMemoryWorkspace['originalDocuments'][string]
      path: string[]
    }
  | {
      type: 'intermediateDocuments'
      documentName: string
      value: InMemoryWorkspace['intermediateDocuments'][string]
      path: string[]
    }
  | {
      type: 'overrides'
      documentName: string
      value: InMemoryWorkspace['overrides'][string]
    }
  | {
      type: 'meta'
      value: InMemoryWorkspace['meta']
    }
  | {
      type: 'deleteDocument'
      documentName: string
    }
  | {
      type: 'history'
      documentName: string
      value: InMemoryWorkspace['history'][string]
    }
  | {
      type: 'auth'
      documentName: string
      value: InMemoryWorkspace['auth'][string]
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
