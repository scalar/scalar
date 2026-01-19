import type { WorkspaceStore } from '@/client'
import type { TagEvents } from '@/events/definitions/tag'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'

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
    return
  }

  if (!document.tags) {
    document.tags = []
  }

  document.tags.push({
    name: payload.name,
  })
}

/**
 * Deletes a tag from the workspace
 *
 * Example:
 * ```ts
 * deleteTag({
 *   document,
 *   name: 'tag',
 * })
 * ```
 */
export const deleteTag = (workspace: WorkspaceStore | null, payload: TagEvents['tag:delete:tag']) => {
  const document = workspace?.workspace.documents[payload.documentName]
  if (!document) {
    return
  }

  // Clear tags from all operations that have this tag
  Object.values(document.paths ?? {}).forEach((path) => {
    Object.values(path).forEach((operation) => {
      // Only process operations that are objects
      if (typeof operation !== 'object' || Array.isArray(operation)) {
        return
      }

      const resolvedOperation = getResolvedRef(operation)

      if ('tags' in resolvedOperation) {
        resolvedOperation.tags = unpackProxyObject(
          resolvedOperation.tags?.filter((tag) => tag !== payload.name),
          { depth: 2 },
        )
      }
    })
  })

  // Remove the tag from all webhooks that have this tag
  Object.values(document.webhooks ?? {}).forEach((webhook) => {
    Object.values(webhook).forEach((operation) => {
      if (typeof operation !== 'object' || Array.isArray(operation)) {
        return
      }

      const resolvedOperation = getResolvedRef(operation)

      resolvedOperation.tags = unpackProxyObject(
        resolvedOperation.tags?.filter((tag) => tag !== payload.name),
        { depth: 2 },
      )
    })
  })

  // Remove the tag from the document tags array
  document.tags = unpackProxyObject(
    document.tags?.filter((tag) => tag.name !== payload.name),
    { depth: 2 },
  )
}

export const tagMutatorsFactory = ({ store }: { store: WorkspaceStore | null }) => {
  return {
    createTag: (payload: TagEvents['tag:create:tag']) => createTag(store, payload),
    deleteTag: (payload: TagEvents['tag:delete:tag']) => deleteTag(store, payload),
  }
}
