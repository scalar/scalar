/**
 * Represents the possible types of changes that can be made to a document.
 * - 'add': A new property is added
 * - 'update': An existing property's value is changed
 * - 'delete': A property is removed
 */
type ChangeType = 'add' | 'update' | 'delete'

/**
 * Represents a single difference between two documents.
 * @property path - Array of strings representing the path to the changed property
 * @property changes - The new value for the property (for add/update) or the old value (for delete)
 * @property type - The type of change that occurred
 */
export type Difference<_T> = { path: string[]; changes: any; type: ChangeType }

/**
 * Get the difference between two objects.
 *
 * This function performs a breadth-first comparison between two objects and returns
 * a list of operations needed to transform the first object into the second.
 *
 * @param doc1 - The source object to compare from
 * @param doc2 - The target object to compare to
 * @returns A list of operations (add/update/delete) with their paths and changes
 *
 * @example
 * // Compare two simple objects
 * const original = { name: 'John', age: 30 }
 * const updated = { name: 'John', age: 31, city: 'New York' }
 * const differences = diff(original, updated)
 * // Returns:
 * // [
 * //   { path: ['age'], changes: 31, type: 'update' },
 * //   { path: ['city'], changes: 'New York', type: 'add' }
 * // ]
 *
 * @example
 * // Compare nested objects
 * const original = {
 *   user: { name: 'John', settings: { theme: 'light' } }
 * }
 * const updated = {
 *   user: { name: 'John', settings: { theme: 'dark' } }
 * }
 * const differences = diff(original, updated)
 * // Returns:
 * // [
 * //   { path: ['user', 'settings', 'theme'], changes: 'dark', type: 'update' }
 * // ]
 */
export const diff = <T extends Record<string, unknown>>(doc1: Record<string, unknown>, doc2: T) => {
  const diff: Difference<T>[] = []

  const bfs = (el1: unknown, el2: unknown, prefix = []) => {
    // If the types are different, we know that the property has been added, deleted or updated
    if (typeof el1 !== typeof el2) {
      if (typeof el1 === 'undefined') {
        diff.push({ path: prefix, changes: el2, type: 'add' })
        return
      }

      if (typeof el2 === 'undefined') {
        diff.push({ path: prefix, changes: el1, type: 'delete' })
        return
      }

      diff.push({ path: prefix, changes: el2, type: 'update' })
      return
    }

    // We now can assume that el1 and el2 are of the same type

    // For nested objects, we need to recursively check the properties
    if (typeof el1 === 'object' && typeof el2 === 'object' && el1 !== null && el2 !== null) {
      const keys = new Set([...Object.keys(el1), ...Object.keys(el2)])

      for (const key of keys) {
        // @ts-ignore
        bfs(el1[key], el2[key], [...prefix, key])
      }
      return
    }

    // For primitives, we can just compare the values
    if (el1 !== el2) {
      diff.push({ path: prefix, changes: el2, type: 'update' })
    }
  }

  // Run breadth-first search
  bfs(doc1, doc2)
  return diff
}
