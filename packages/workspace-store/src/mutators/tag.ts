import type { WorkspaceStore } from '@/client'
import type { TagEvents } from '@/events/definitions/tag'

/**
 * Adds a new tag to the WorkspaceDocument's `tags` array.
 *
 * If the document or its tags property does not exist, the function safely no-ops or initializes `tags` as needed.
 *
 * @param document - The target WorkspaceDocument
 * @param payload - The name of the tag to add
 */
export const createTag = (store: WorkspaceStore | null, payload: TagEvents['tag:create:tag']) => {
  const document = store?.workspace.documents[payload.documentName]

  if (!document) {
    console.error('Document not found', { payload, store })
    payload.callback?.(false)
    return
  }

  if (!document.tags) {
    document.tags = []
  }

  document.tags.push({
    name: payload.name,
  })

  payload.callback?.(true)
}
