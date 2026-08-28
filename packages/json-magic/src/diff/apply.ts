import { isPollutionKey } from '@scalar/helpers/object/prevent-pollution'

import type { Difference } from '@/diff/diff'

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
 * Paths that reach the prototype chain (`__proto__`, `constructor` or `prototype`) are rejected
 * before anything is written, so a hostile changeset cannot poison `Object.prototype`.
 *
 * A change with an empty path asks to replace the document itself, which is not supported: the
 * function writes through the parent container of each path and the root has no parent. `diff`
 * emits such a change whenever the two documents differ at the root, which covers a different
 * `typeof`, `null` against an object, and an array on one side against a plain object on the
 * other. Those changesets have to be handled by the caller instead of being applied.
 *
 * ⚠️ `document` is mutated in place and the result shares structure with the document the diff was
 * built from: every `add` and `update` writes the change into the document by reference, and those
 * changes are live references into the target document `diff` compared (see `diff`). A later write
 * into the result can therefore be seen through that document, and the other way around. Callers
 * that need an isolated result have to deep clone the document and the changes first.
 *
 * @param document - The original document to apply changes to, mutated in place
 * @param diff - Array of differences to apply, each containing a path and change type
 * @returns The modified document with all changes applied, structurally shared with the changes
 * @throws {InvalidChangesDetectedError} When a path is unusable, empty or reaches the prototype chain
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
  const applyChange = (current: any, path: string[], d: Difference<T>, depth = 0) => {
    if (path[depth] === undefined) {
      throw new InvalidChangesDetectedError(
        `Process aborted. Path ${path.join('.')} at depth ${depth} is undefined, check diff object`,
      )
    }

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

  // Reject the two kinds of unusable entry we can spot without walking the document - a root level
  // change and a prototype reaching path - before any entry touches it. A path that does not exist
  // is only found while traversing, so that one can still leave the document half updated.
  for (const d of diff) {
    // An empty path targets the document itself. We only ever write through the parent container of
    // a path, so there is nothing to write into for the root, and the caller has to swap the
    // document out on its own.
    if (d.path.length === 0) {
      throw new InvalidChangesDetectedError(
        'Process aborted. Root-level replacement is not supported, the change targets the document itself instead of a property inside it',
      )
    }

    // A path segment such as `__proto__` would make the traversal walk onto `Object.prototype` and
    // write there, poisoning every object in the runtime. `diff` never emits these segments, so
    // only a hand-crafted changeset reaches this guard.
    const unsafeSegment = d.path.find(isPollutionKey)

    if (unsafeSegment !== undefined) {
      throw new InvalidChangesDetectedError(
        `Process aborted. Path ${d.path.join('.')} contains the unsafe segment "${unsafeSegment}", which can modify the prototype chain`,
      )
    }
  }

  for (const d of diff) {
    applyChange(document, d.path, d)
  }

  // It is safe to cast here because this function mutates the input document
  // to match the target type T as described by the diff changeset.
  return document as T
}
