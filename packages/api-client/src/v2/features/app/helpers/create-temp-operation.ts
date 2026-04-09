import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

/**
 * Generates a unique temporary operation path for a new operation.
 * Tries up to 10 times to generate a non-colliding path, then falls back to a static path.
 *
 * Example:
 * const existingPaths = new Set(['/tempabcd1234', '/tempdeadbeef']);
 * const newPath = generateUniquePath('my-doc', existingPaths); // e.g. "/tempa1b2c3d4"
 *
 * @param documentName - Name of the document (not used here, but for potential future uniqueness)
 * @param existingPaths - Set of paths already present in the document to avoid collisions
 * @param attempts - Used internally to limit recursion (default: 0)
 * @returns A unique operation path (e.g., "/temp1234abcd")
 */
const generateUniquePath = (documentName: string, existingPaths: Set<string>, attempts: number = 0) => {
  if (attempts > 10) {
    // After 10 failed attempts, fallback to a generic path
    return '/temp-path'
  }

  // Generate a random path using a truncated UUID for uniqueness
  const path = `/temp${crypto.randomUUID().slice(0, 8)}`

  if (existingPaths.has(path)) {
    // If path exists, try again recursively with incremented attempts
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
export const createTempOperation = (
  documentName: string,
  options: {
    existingPaths: Set<string>
    eventBus: WorkspaceEventBus
    tags?: string[]
  },
) => {
  const uniquePath = generateUniquePath(documentName, options.existingPaths)

  options.eventBus.emit('operation:create:operation', {
    documentName,
    path: uniquePath,
    method: 'get',
    operation: {
      tags: options.tags ?? [],
    },
    callback: (success) => {
      if (success) {
        options.eventBus.emit('ui:navigate', {
          page: 'example',
          documentSlug: documentName,
          path: uniquePath,
          method: 'get',
          exampleName: 'default',
          callback: async () => {
            await new Promise((resolve) => requestAnimationFrame(resolve))
            // Focus the address bar, clearing its contents after navigation
            options.eventBus.emit('ui:focus:address-bar', {
              clear: true,
            })
          },
        })
      }
    },
  })
}
