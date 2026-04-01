import type { Difference } from '@/diff/diff'

export class InvalidChangesDetectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidChangesDetectedError'
  }
}

const isLegacyAddOrUpdate = <T>(diff: Difference<T>): diff is Extract<Difference<T>, { type: 'add' | 'update' }> =>
  diff.type === 'add' || diff.type === 'update'

const isMicroCreateOrChange = <T>(
  diff: Difference<T>,
): diff is Extract<Difference<T>, { type: 'CREATE' | 'CHANGE' }> => diff.type === 'CREATE' || diff.type === 'CHANGE'

const getChangeValue = <T>(diff: Difference<T>): T | undefined => {
  if (isLegacyAddOrUpdate(diff)) {
    return diff.changes
  }

  if (isMicroCreateOrChange(diff)) {
    return diff.value
  }

  return undefined
}

const isDelete = <T>(diff: Difference<T>): boolean => diff.type === 'delete' || diff.type === 'REMOVE'

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
export const apply = <T extends Record<string, unknown>>(
  document: Record<string, unknown>,
  diff: Difference<T>[],
): T => {
  // Traverse the object and apply the change
  const applyChange = (current: any, path: (string | number)[], d: Difference<T>, depth = 0) => {
    if (path[depth] === undefined) {
      throw new InvalidChangesDetectedError(
        `Process aborted. Path ${path.map(String).join('.')} at depth ${depth} is undefined, check diff object`,
      )
    }

    // We reach where we want to be, now we can apply changes
    if (depth >= path.length - 1) {
      const nextValue = getChangeValue(d)
      if (!isDelete(d) && nextValue !== undefined) {
        current[path[depth]] = nextValue
      } else {
        // For arrays we don't use delete operator since it will leave blank spots and not actually remove the element
        if (Array.isArray(current)) {
          current.splice(Number(path[depth]), 1)
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

  // It is safe to cast here because this function mutates the input document
  // to match the target type T as described by the diff changeset.
  return document as T
}
