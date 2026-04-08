import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

const generateUniquePath = (documentName: string, existingPaths: Set<string>, attempts: number = 0) => {
  if (attempts > 10) {
    // Stop after 10 attempts, return a random path
    return '/temp-path'
  }

  const path = `/temp${crypto.randomUUID().slice(0, 8)}`

  if (existingPaths.has(path)) {
    return generateUniquePath(documentName, existingPaths, attempts + 1)
  }

  return path
}

/**
 * Creates a temporary operation with a unique path, emits its creation on the event bus,
 * then navigates to the operation and focuses the address bar if successful.
 * @param documentName - The name of the document to add the operation to
 * @param existingPaths - Set of existing operation paths for uniqueness checking
 * @param eventBus - The workspace event bus to emit events on
 */
export const createTempOperation = (documentName: string, existingPaths: Set<string>, eventBus: WorkspaceEventBus) => {
  const uniquePath = generateUniquePath(documentName, existingPaths)

  eventBus.emit('operation:create:operation', {
    documentName,
    path: uniquePath,
    method: 'get',
    operation: {
      tags: [],
    },
    callback: (success) => {
      if (success) {
        eventBus.emit('ui:navigate', {
          page: 'example',
          documentSlug: documentName,
          path: uniquePath,
          method: 'get',
          exampleName: 'default',
          callback: async () => {
            await new Promise((resolve) => requestAnimationFrame(resolve))
            // Focus the address bar, clearing its contents after navigation
            eventBus.emit('ui:focus:address-bar', {
              clear: true,
            })
          },
        })
      }
    },
  })
}
