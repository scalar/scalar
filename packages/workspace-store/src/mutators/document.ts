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

/**
 * Updates the "watch mode" state of the given document.
 *
 * @param document WorkspaceDocument or null – The document to modify.
 * @param watchMode boolean – True enables watch mode, false disables it.
 *
 * If document is null, does nothing.
 */
export const updateWatchMode = (document: WorkspaceDocument | null, watchMode: boolean) => {
  if (!document) {
    return
  }

  // Set (or unset) the x-scalar-watch-mode property on the document
  document['x-scalar-watch-mode'] = watchMode
}

/**
 * Updates the document's info object (typically, title, description, version, etc.).
 *
 * Uses a shallow merge: only properties present in payload will be overwritten or added.
 *
 * @param document WorkspaceDocument | null – The document whose info should be updated.
 * @param payload DocumentEvents['document:update:info'] – Partial info fields to update/merge.
 *
 * If document is null, does nothing.
 */
export const updateDocumentInfo = (
  document: WorkspaceDocument | null,
  payload: DocumentEvents['document:update:info'],
) => {
  if (!document) {
    return
  }
  // Merge the given payload into the document's info object
  mergeObjects(document.info, payload)

  // Update the document title if it is present and the navigation object is present
  // We do this because we don't want to rebuild the entire navigation object if only the title is changed
  if (payload.title && document['x-scalar-navigation']) {
    document['x-scalar-navigation'].title = payload.title
  }
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

/**
 * Creates an empty OpenAPI document and adds it to the workspace.
 *
 * - If the store is null, this is a no-op.
 * - The document name must be unique; if already present, callback is called with `false`.
 * - On success, a new OpenAPI 3.1.0 document is added with a basic path and info.
 * - Callback is called with `true` if document is created.
 *
 * @param store WorkspaceStore | null – The workspace store to add the document to.
 * @param payload DocumentEvents['document:create:empty-document'] – Contains name, icon, and callback.
 */
export const createEmptyDocument = async (
  store: WorkspaceStore | null,
  payload: DocumentEvents['document:create:empty-document'],
) => {
  if (!store) {
    return
  }

  // Check if the document already exists by name for uniqueness
  if (store.workspace.documents[payload.name]) {
    // Document name already exists, call callback with false
    payload.callback?.(false)
    return
  }

  // Add a new empty OpenAPI 3.1.0 document with minimal info and icon
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

  // Notify success via callback
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
