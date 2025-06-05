import type { Difference } from '@/diff'

export class InvalidChangesDetectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidChangesDetectedError'
  }
}

/**
 * Applies a set of differences to a document object.
 * The function traverses the document structure following the paths specified in the differences
 * and applies the corresponding changes (add, update, or delete) at each location.
 *
 * @param document - The original document to apply changes to
 * @param diff - Array of differences to apply, each containing a path and change type
 * @returns The modified document with all changes applied
 *
 * @example
 * const original = {
 *   paths: {
 *     '/users': {
 *       get: { responses: { '200': { description: 'OK' } } }
 *     }
 *   }
 * }
 *
 * const changes = [
 *   {
 *     path: ['paths', '/users', 'get', 'responses', '200', 'content'],
 *     type: 'add',
 *     changes: { 'application/json': { schema: { type: 'object' } } }
 *   }
 * ]
 *
 * const updated = apply(original, changes)
 * // Result: original document with content added to the 200 response
 */
export const apply = (document: Record<string, unknown>, diff: Difference[]): Record<string, unknown> => {
  // Traverse the object and apply the change
  const applyChange = (current: any, path: string[], d: Difference, depth = 0) => {
    // We reach where we want to be, now we can apply changes
    if (depth >= path.length - 1) {
      if (d.type === 'add' || d.type === 'update') {
        current[path[depth]] = d.changes
      } else {
        // For arrays we don't use delete operator since it will leave blank spots and not actually remove the element
        if (Array.isArray(current)) {
          current.splice(Number.parseInt(path[depth]), 1)
        } else {
          delete current[path[depth]]
        }
      }
      return
    }

    // Throw an error
    // This scenario should not happen
    // 1- if we are adding a new entry, the diff should only give us the higher level diff
    // 2- if we are updating/deleting an entry, the path to that entry should exists
    if (current[path[depth]] === undefined || typeof current[path[depth]] !== 'object') {
      throw new InvalidChangesDetectedError('Process aborted, check diff object')
    }
    applyChange(current[path[depth]], path, d, depth + 1)
  }

  for (const d of diff) {
    applyChange(document, d.path, d)
  }

  return document
}
