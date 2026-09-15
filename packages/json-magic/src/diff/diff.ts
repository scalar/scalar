import { isPollutionKey } from '@scalar/helpers/object/prevent-pollution'

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
 * Keys that reach the prototype chain (`__proto__`, `constructor` and `prototype`) are skipped, so
 * an untrusted document cannot produce a diff that poisons `Object.prototype` once applied.
 *
 * ⚠️ The returned `changes` are live references into the documents, not clones. An `add` or an
 * `update` carries the very subtree `doc2` holds, and a `delete` carries the subtree from `doc1`,
 * so writing into a change writes into the document it came from. This matters downstream:
 * `merge` merges values into these objects, and `apply` writes them into its target document,
 * which leaves the result structurally shared with `doc2`. Callers that need isolation have to
 * deep clone the documents before diffing them, or the changes afterwards.
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
      // A container type change (array to plain object or vice versa) is a single update.
      // Recursing would treat array indices as object keys and produce per-key
      // differences that corrupt the container when applied.
      if (Array.isArray(el1) !== Array.isArray(el2)) {
        diff.push({ path: prefix, changes: el2, type: 'update' })
        return
      }

      // Keys that reach `Object.prototype` are dropped before we recurse. `JSON.parse` turns
      // `__proto__` into a real own property that `Object.keys` reports, so an untrusted document
      // would otherwise make us walk the prototype chain and emit a diff that poisons every object
      // in the runtime once applied. `apply` rejects the same segments, so nothing emitted here can
      // be turned away later. Note that this only covers the keys compared position by position: a
      // brand new subtree is emitted as a single value and carries its own keys along untouched.
      const keys = [...new Set([...Object.keys(el1), ...Object.keys(el2)])].filter((key) => !isPollutionKey(key))

      // Removed array elements are applied with `splice` (see `apply`), which re-indexes every
      // element after the removed one. Emitting the highest index first keeps the remaining indices
      // valid, so an array that loses more than one element still applies correctly. Please keep
      // this ordering in place, applying the same deletes in ascending order corrupts the array.
      // Only an array that shrinks can lose elements, so an array that grows keeps the natural
      // ascending order. Equal length arrays cannot lose elements either, they take the reversed
      // branch to keep the guard simple. Deletes nested inside elements are object keys rather than
      // array indices, so they never reach `splice` and are unaffected by the order.
      // `keys` is a fresh array, so reversing it in place is safe.
      const orderedKeys = Array.isArray(el1) && Array.isArray(el2) && el1.length >= el2.length ? keys.reverse() : keys

      for (const key of orderedKeys) {
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
