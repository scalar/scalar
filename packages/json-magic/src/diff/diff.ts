/**
 * Represents a segment in a nested object path.
 * Arrays use numeric indices while objects use string keys.
 */
export type PathSegment = string | number

type LegacyChangeType = 'add' | 'update' | 'delete'
type MicroChangeType = 'CREATE' | 'CHANGE' | 'REMOVE'

type LegacyDifference<T> = {
  path: PathSegment[]
  changes: T
  type: LegacyChangeType
}

type MicroCreateDifference<T> = {
  path: PathSegment[]
  type: 'CREATE'
  value: T
}

type MicroChangeDifference<T> = {
  path: PathSegment[]
  type: 'CHANGE'
  oldValue: T
  value: T
}

type MicroRemoveDifference<T> = {
  path: PathSegment[]
  type: 'REMOVE'
  oldValue: T
}

/**
 * Represents a single difference between two documents.
 *
 * For backwards compatibility this type supports both:
 * - Legacy `json-magic` diff shape (`add`/`update`/`delete` + `changes`)
 * - Microdiff-compatible shape (`CREATE`/`CHANGE`/`REMOVE` + `value`/`oldValue`)
 */
export type Difference<T = unknown> =
  | LegacyDifference<T>
  | MicroCreateDifference<T>
  | MicroChangeDifference<T>
  | MicroRemoveDifference<T>

const isIndexKey = (value: string): boolean => /^\d+$/.test(value)

const toPathSegment = (container: unknown, key: string): PathSegment => {
  if (Array.isArray(container) && isIndexKey(key)) {
    return Number(key)
  }

  return key
}

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

  const bfs = (el1: unknown, el2: unknown, prefix: PathSegment[] = []) => {
    if (Object.is(el1, el2)) {
      return
    }

    if (typeof el1 === 'undefined') {
      diff.push({ path: prefix, type: 'CREATE', value: el2 as T })
      return
    }

    if (typeof el2 === 'undefined') {
      diff.push({ path: prefix, type: 'REMOVE', oldValue: el1 as T })
      return
    }

    const isObjectPair =
      typeof el1 === 'object' &&
      typeof el2 === 'object' &&
      el1 !== null &&
      el2 !== null

    if (isObjectPair) {
      const left = el1 as Record<string, unknown>
      const right = el2 as Record<string, unknown>
      const keys = new Set([...Object.keys(left), ...Object.keys(right)])

      for (const key of keys) {
        const pathSegment = toPathSegment(Array.isArray(left) ? left : right, key)
        bfs(left[key], right[key], [...prefix, pathSegment])
      }
      return
    }

    diff.push({ path: prefix, type: 'CHANGE', oldValue: el1 as T, value: el2 as T })
  }

  // Run breadth-first search
  bfs(doc1, doc2)
  return diff
}
