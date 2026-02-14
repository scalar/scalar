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
 * Edits a tag in the WorkspaceDocument's
 *
 * @param document - The target WorkspaceDocument
 * @param payload - holds the old tag and the new name
 */
export const editTag = (store: WorkspaceStore | null, payload: TagEvents['tag:edit:tag']) => {
  const document = store?.workspace.documents[payload.documentName]
  if (!document) {
    console.error('Document not found', { payload, store })
    return
  }

  console.log('editTag', { payload })

  const oldName = payload.tag.name
  const newName = payload.newName

  if (document.tags?.length) {
    const plainTags = unpackProxyObject(document.tags, { depth: null })
    document.tags = plainTags.map((tag) => (tag.name === oldName ? { ...tag, name: newName } : tag))
  }

  console.log('document.tags', { document })

  // Update the tag name in all child operations and webhooks
  payload.tag.children?.forEach((child) => {
    // Operation
    if (child.type === 'operation') {
      const operation = getResolvedRef(document.paths?.[child.path]?.[child.method])

      if (operation && 'tags' in operation) {
        const plainTags = unpackProxyObject(operation.tags, { depth: null })
        operation.tags = plainTags?.map((tag) => (tag === oldName ? newName : tag))
      }
    }

    // Webhook
    else if (child.type === 'webhook') {
      const webhook = getResolvedRef(document.webhooks?.[child.name]?.[child.method])

      if (webhook && 'tags' in webhook) {
        const plainTags = unpackProxyObject(webhook.tags, { depth: null })
        webhook.tags = plainTags?.map((tag) => (tag === oldName ? newName : tag))
      }
    }
  })

  // Update x-tagGroups references to the renamed tag
  if (document['x-tagGroups']) {
    const plainGroups = unpackProxyObject(document['x-tagGroups'], { depth: null })
    document['x-tagGroups'] = plainGroups.map((group) => ({
      ...group,
      tags: group.tags.map((tag) => (tag === oldName ? newName : tag)),
    }))
  }

  console.log('updated children', { document })

  // Rebuild the sidebar
  store?.buildSidebar(payload.documentName)
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
        const plainTags = unpackProxyObject(resolvedOperation.tags, { depth: null })
        resolvedOperation.tags = plainTags?.filter((tag) => tag !== payload.name)
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

      const plainTags = unpackProxyObject(resolvedOperation.tags, { depth: null })
      resolvedOperation.tags = plainTags?.filter((tag) => tag !== payload.name)
    })
  })

  // Remove the tag from the document tags array
  const plainDocTags = unpackProxyObject(document.tags, { depth: null })
  document.tags = plainDocTags?.filter((tag) => tag.name !== payload.name)
}

export const tagMutatorsFactory = ({ store }: { store: WorkspaceStore | null }) => {
  return {
    createTag: (payload: TagEvents['tag:create:tag']) => createTag(store, payload),
    editTag: (payload: TagEvents['tag:edit:tag']) => editTag(store, payload),
    deleteTag: (payload: TagEvents['tag:delete:tag']) => deleteTag(store, payload),
  }
}
