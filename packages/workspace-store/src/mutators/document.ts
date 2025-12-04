import type { WorkspaceStore } from '@/client'
import type { DocumentEvents } from '@/events/definitions/document'
import type { WorkspaceDocument } from '@/schemas'

/**
 * Toggle setting selected security schemes at the operation level
 */
export const toggleSecurity = (document: WorkspaceDocument | null) => {
  if (!document) {
    return
  }

  document['x-scalar-set-operation-security'] = !document['x-scalar-set-operation-security']
}

export const updateWatchMode = (document: WorkspaceDocument | null, watchMode: boolean) => {
  if (!document) {
    return
  }

  document['x-scalar-watch-mode'] = watchMode
}

/**
 * Update the document icon and also update the corresponding sidebar entry
 *
 * Does not perform a sidebar rebuild for performance benefit
 */
export const updateDocumentIcon = (document: WorkspaceDocument | null, icon: string) => {
  if (!document || !document['x-scalar-navigation']) {
    return
  }

  // Update the document icon
  document['x-scalar-icon'] = icon
  // Update the sidebar document icon
  document['x-scalar-navigation'].icon = icon
}

export const createEmptyDocument = async (
  store: WorkspaceStore | null,
  payload: DocumentEvents['document:create:empty-document'],
) => {
  if (!store) {
    return
  }

  // Check if the document already exists
  // name should be unique
  if (store.workspace.documents[payload.name]) {
    payload.callback?.(false)
    return
  }

  await store.addDocument({
    name: payload.name,
    document: {
      openapi: '3.1.0',
      info: { title: payload.name, version: '1.0.0' },
      paths: {
        '/': {
          get: {},
        },
      },
      'x-scalar-icon': payload.icon,
    },
  })

  payload.callback?.(true)
}

export const deleteDocument = (store: WorkspaceStore | null, payload: DocumentEvents['document:delete:document']) => {
  if (!store) {
    return
  }

  store.deleteDocument(payload.name)
}
