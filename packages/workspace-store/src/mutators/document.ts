import type { WorkspaceStore } from '@/client'
import type { DocumentEvents } from '@/events/definitions/document'
import { mergeObjects } from '@/helpers/merge-object'
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

export const updateDocumentInfo = (
  document: WorkspaceDocument | null,
  payload: DocumentEvents['document:update:info'],
) => {
  if (!document) {
    return
  }
  mergeObjects(document.info, payload)
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

/**
 * Deletes a document from the workspace by its name.
 *
 * Safely no-ops if the store is null.
 */
export const deleteDocument = (store: WorkspaceStore | null, payload: DocumentEvents['document:delete:document']) => {
  if (!store) {
    return
  }

  store.deleteDocument(payload.name)
}

export const documentMutatorsFactory = ({
  document,
  store,
}: {
  document: WorkspaceDocument | null
  store: WorkspaceStore | null
}) => {
  return {
    toggleSecurity: () => toggleSecurity(document),
    updateDocumentInfo: (payload: DocumentEvents['document:update:info']) => updateDocumentInfo(document, payload),
    updateWatchMode: (payload: DocumentEvents['document:update:watch-mode']) => updateWatchMode(document, payload),
    updateDocumentIcon: (payload: DocumentEvents['document:update:icon']) => updateDocumentIcon(document, payload),
    createEmptyDocument: (payload: DocumentEvents['document:create:empty-document']) =>
      createEmptyDocument(store, payload),
    deleteDocument: (payload: DocumentEvents['document:delete:document']) => deleteDocument(store, payload),
  }
}
