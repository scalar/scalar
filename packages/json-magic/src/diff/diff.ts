type LegacyChangeType = 'add' | 'update' | 'delete'
type LegacyDifference<T> = {
  path: string[]
  changes: T
  type: LegacyChangeType
}

/**
 * Microdiff-compatible diff shape used by consumers that expect
 * `CREATE` / `CHANGE` / `REMOVE` operations.
 */
export type MicroDifference<T = unknown> =
  | {
      path: (string | number)[]
      type: 'CREATE'
      value: T
    }
  | {
      path: (string | number)[]
      type: 'CHANGE'
      oldValue: T
      value: T
    }
  | {
      path: (string | number)[]
      type: 'REMOVE'
      oldValue: T
    }

/**
 * Legacy diff shape used by `apply` and `merge`.
 */
export type Difference<T = unknown> = LegacyDifference<T>

type DiffOptions = {
  format?: 'legacy' | 'micro'
}

const isObjectPair = (left: unknown, right: unknown): boolean =>
  typeof left === 'object' &&
  left !== null &&
  typeof right === 'object' &&
  right !== null

const createPairGuard = () => {
  const seen = new WeakMap<object, WeakSet<object>>()

  return (left: object, right: object): boolean => {
    const rightMap = seen.get(left)
    if (rightMap?.has(right)) {
      return true
    }

    if (rightMap) {
      rightMap.add(right)
      return false
    }

    seen.set(left, new WeakSet([right]))
    return false
  }
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
export function diff<T>(doc1: unknown, doc2: T, options: { format: 'micro' }): MicroDifference<T>[]
export function diff<T>(doc1: unknown, doc2: T, options?: DiffOptions): Difference<T>[]
export function diff<T>(doc1: unknown, doc2: T, options: DiffOptions = {}): Difference<T>[] | MicroDifference<T>[] {
  if (options.format === 'micro') {
    const changes: MicroDifference<T>[] = []
    const isSeenPair = createPairGuard()

    const bfs = (el1: unknown, el2: unknown, prefix: (string | number)[] = []) => {
      if (Object.is(el1, el2)) {
        return
      }

      if (typeof el1 === 'undefined') {
        changes.push({ path: prefix, type: 'CREATE', value: el2 as T })
        return
      }

      if (typeof el2 === 'undefined') {
        changes.push({ path: prefix, type: 'REMOVE', oldValue: el1 as T })
        return
      }

      if (isObjectPair(el1, el2)) {
        const left = el1 as Record<string, unknown>
        const right = el2 as Record<string, unknown>
        if (isSeenPair(left, right)) {
          return
        }

        const keys = new Set([...Object.keys(left), ...Object.keys(right)])
        for (const key of keys) {
          const pathSegment = (Array.isArray(left) || Array.isArray(right)) && /^\d+$/.test(key) ? Number(key) : key
          bfs(left[key], right[key], [...prefix, pathSegment])
        }
        return
      }

      changes.push({ path: prefix, type: 'CHANGE', oldValue: el1 as T, value: el2 as T })
    }

    bfs(doc1, doc2)
    return changes
  }

  const changes: Difference<T>[] = []
  const isSeenPair = createPairGuard()

  const bfs = (el1: unknown, el2: unknown, prefix: string[] = []) => {
    // If the types are different, we know that the property has been added, deleted or updated
    if (typeof el1 !== typeof el2) {
      if (typeof el1 === 'undefined') {
        changes.push({ path: prefix, changes: el2 as T, type: 'add' })
        return
      }

      if (typeof el2 === 'undefined') {
        changes.push({ path: prefix, changes: el1 as T, type: 'delete' })
        return
      }

      changes.push({ path: prefix, changes: el2 as T, type: 'update' })
      return
    }

    // We now can assume that el1 and el2 are of the same type

    // For nested objects, we need to recursively check the properties
    if (isObjectPair(el1, el2)) {
      const left = el1 as Record<string, unknown>
      const right = el2 as Record<string, unknown>
      if (isSeenPair(left, right)) {
        return
      }

      const keys = new Set([...Object.keys(left), ...Object.keys(right)])

      for (const key of keys) {
        bfs(left[key], right[key], [...prefix, key])
      }
      return
    }

    // For primitives, we can just compare the values
    if (el1 !== el2) {
      changes.push({ path: prefix, changes: el2 as T, type: 'update' })
    }
  }

  bfs(doc1, doc2)
  return changes
}
