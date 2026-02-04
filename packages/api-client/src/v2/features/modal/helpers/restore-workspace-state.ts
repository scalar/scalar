import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'

/**
 * Restores the state of a workspace document by reverting its state
 * to the specified import, while preserving certain live properties
 * such as servers, security schemes, and selected server.
 */
export const restoreWorkspaceState = ({
  workspaceStore,
  workspaceState,
  name,
}: {
  workspaceStore: WorkspaceStore | null
  workspaceState: InMemoryWorkspace
  name: string
}): { ok: true } | { ok: false; error: string } => {
  if (!workspaceStore) {
    return { ok: false, error: 'Workspace store is not available' }
  }

  const currentDocument = unpackProxyObject(workspaceStore.workspace.documents[name])
  if (!currentDocument) {
    return { ok: false, error: 'Current document not found in workspace store' }
  }

  const importingDocument = workspaceState.documents[name]
  if (!importingDocument) {
    return { ok: false, error: 'Importing document not found in workspace state' }
  }

  // Preserve some of the document properties we want to keep
  const persistedProperties = {
    selectedServer: currentDocument['x-scalar-selected-server'],
    securitySchemes: currentDocument.components?.securitySchemes,
    servers: currentDocument.servers,
  }

  // We only revert the active state of the document itself
  workspaceStore.loadWorkspace({
    meta: {},
    documents: {
      [name]: importingDocument,
    },
    intermediateDocuments: {},
    originalDocuments: {},
    overrides: {},
    history: {},
    auth: {},
  })

  const newDocument = unpackProxyObject(workspaceStore.workspace.documents[name])
  if (!newDocument) {
    return { ok: false, error: 'New document not found in workspace store' }
  }

  // Now restore the persisted properties
  // ------------------------------------------------------------
  // Server selection
  newDocument['x-scalar-selected-server'] = persistedProperties.selectedServer
  newDocument.servers = persistedProperties.servers

  // ------------------------------------------------------------
  // Security schemes
  newDocument.components ??= {}
  newDocument.components.securitySchemes = persistedProperties.securitySchemes

  return { ok: true }
}
