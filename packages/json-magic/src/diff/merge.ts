import type { Difference, PathSegment } from '@/diff/diff'
import { Trie } from '@/diff/trie'
import { isArrayEqual, isKeyCollisions, mergeObjects } from '@/diff/utils'

type LegacyDiff = Extract<Difference<unknown>, { type: 'add' | 'update' | 'delete' }>
type MicroDiff = Extract<Difference<unknown>, { type: 'CREATE' | 'CHANGE' | 'REMOVE' }>

type NormalizedDiff = {
  path: PathSegment[]
  type: 'add' | 'update' | 'delete'
  changes?: unknown
  oldValue?: unknown
}

const isLegacyDiff = (difference: Difference<unknown>): difference is LegacyDiff =>
  difference.type === 'add' || difference.type === 'update' || difference.type === 'delete'

const normalizeDiff = (difference: Difference<unknown>): NormalizedDiff => {
  if (isLegacyDiff(difference)) {
    return difference
  }

  if (difference.type === 'CREATE') {
    return {
      path: difference.path,
      type: 'add',
      changes: difference.value,
    }
  }

  if (difference.type === 'REMOVE') {
    return {
      path: difference.path,
      type: 'delete',
      oldValue: difference.oldValue,
      changes: difference.oldValue,
    }
  }

  return {
    path: difference.path,
    type: 'update',
    oldValue: difference.oldValue,
    changes: difference.value,
  }
}

const denormalizeDiff = <T>(difference: Difference<T>, normalized: NormalizedDiff): Difference<T> => {
  if (isLegacyDiff(difference as Difference<unknown>)) {
    return {
      path: normalized.path,
      type: normalized.type,
      changes: normalized.changes,
    } as Difference<T>
  }

  const micro = difference as MicroDiff
  if (micro.type === 'CREATE') {
    return {
      path: normalized.path,
      type: 'CREATE',
      value: normalized.changes as T,
    }
  }

  if (micro.type === 'REMOVE') {
    return {
      path: normalized.path,
      type: 'REMOVE',
      oldValue: normalized.oldValue as T,
    }
  }

  return {
    path: normalized.path,
    type: 'CHANGE',
    oldValue: normalized.oldValue as T,
    value: normalized.changes as T,
  }
}

/**
 * Merges two sets of differences from the same document and resolves conflicts.
 * This function combines changes from two diff lists while handling potential conflicts
 * that arise when both diffs modify the same paths. It uses a trie data structure for
 * efficient path matching and conflict detection.
 *
 * @param diff1 - First list of differences
 * @param diff2 - Second list of differences
 * @returns Object containing:
 *   - diffs: Combined list of non-conflicting differences
 *   - conflicts: Array of conflicting difference pairs that need manual resolution
 *
 * @example
 * // Merge two sets of changes to a user profile
 * const diff1 = [
 *   { path: ['name'], changes: 'John', type: 'update' },
 *   { path: ['age'], changes: 30, type: 'add' }
 * ]
 * const diff2 = [
 *   { path: ['name'], changes: 'Johnny', type: 'update' },
 *   { path: ['address'], changes: { city: 'NY' }, type: 'add' }
 * ]
 * const { diffs, conflicts } = merge(diff1, diff2)
 * // Returns:
 * // {
 * //   diffs: [
 * //     { path: ['age'], changes: 30, type: 'add' },
 * //     { path: ['address'], changes: { city: 'NY' }, type: 'add' }
 * //   ],
 * //   conflicts: [
 * //     [
 * //       [{ path: ['name'], changes: 'John', type: 'update' }],
 * //       [{ path: ['name'], changes: 'Johnny', type: 'update' }]
 * //     ]
 * //   ]
 * // }
 */
export const merge = <T>(diff1: Difference<T>[], diff2: Difference<T>[]) => {
  const normalizedDiff1 = diff1.map((difference) => normalizeDiff(difference as Difference<unknown>))
  const normalizedDiff2 = diff2.map((difference) => normalizeDiff(difference as Difference<unknown>))

  // Here we need to use a trie to optimize searching for a prefix
  // With the naive approach time complexity of the algorithm would be
  //                         O(n * m)
  //                           ^   ^
  // n is the length off diff1 |   | m length of diff2
  //
  // Assuming that the maximum depth of the nested objects would be constant lets say 0 <= D <= 100
  // we try to optimize for that using the tire data structure.
  // So the new time complexity would be O(n * D) where D is the maximum depth of the nested object
  const trie = new Trie<{ index: number; changes: NormalizedDiff }>()

  // Create the trie
  for (const [index, diff] of normalizedDiff1.entries()) {
    trie.addPath(diff.path, { index, changes: diff })
  }

  const skipDiff1 = new Set<number>()
  const skipDiff2 = new Set<number>()

  // Keep related conflicts together for easy A, B pick conflict resolution
  // map key is going to be conflicting index of first diff list where the diff will be
  // a delete operation or an add/update operation with a one to many conflicts
  const conflictsMap1 = new Map<number, [NormalizedDiff[], NormalizedDiff[]]>()
  // map key will be the index from the second diff list where the diff will be
  // a delete operation with one to many conflicts
  const conflictsMap2 = new Map<number, [NormalizedDiff[], NormalizedDiff[]]>()

  for (const [index, diff] of normalizedDiff2.entries()) {
    trie.findMatch(diff.path, (value) => {
      if (diff.type === 'delete') {
        if (value.changes.type === 'delete') {
          // Keep the highest depth delete operation and skip the other
          if (value.changes.path.length > diff.path.length) {
            skipDiff1.add(value.index)
          } else {
            skipDiff2.add(index)
          }
        } else {
          // Take care of updates/add on the same path (we are sure they will be on the
          // same path since the change comes from the same document)
          skipDiff1.add(value.index)
          skipDiff2.add(index)

          const conflictEntry = conflictsMap2.get(index)

          if (conflictEntry !== undefined) {
            conflictEntry[0].push(value.changes)
          } else {
            conflictsMap2.set(index, [[value.changes], [diff]])
          }
        }
      }

      if (diff.type === 'add' || diff.type === 'update') {
        // For add -> add / update -> update operation we try to first see if we can merge this operations
        if (
          isArrayEqual(diff.path, value.changes.path) &&
          value.changes.type !== 'delete' &&
          !isKeyCollisions(diff.changes, value.changes.changes)
        ) {
          skipDiff1.add(value.index)
          // For non primitive values we merge object keys into diff2
          if (typeof diff.changes === 'object') {
            mergeObjects(diff.changes, value.changes.changes)
          }
          return
        }

        // add/update -> delete operations always resolve in conflicts
        skipDiff1.add(value.index)
        skipDiff2.add(index)

        const conflictEntry = conflictsMap1.get(value.index)

        if (conflictEntry !== undefined) {
          conflictEntry[1].push(diff)
        } else {
          conflictsMap1.set(value.index, [[value.changes], [diff]])
        }
      }
    })
  }

  const conflicts: [Difference<T>[], Difference<T>[]][] = [...conflictsMap1.values(), ...conflictsMap2.values()].map(
    ([left, right]) => [
      left.map((entry) => denormalizeDiff(diff1[0] ?? diff2[0], entry)),
      right.map((entry) => denormalizeDiff(diff2[0] ?? diff1[0], entry)),
    ],
  )

  // Filter all changes that should be skipped because of conflicts
  // or auto conflict resolution
  const diffs: Difference<T>[] = [
    ...normalizedDiff1
      .map((entry, index) => ({ entry, index }))
      .filter(({ index }) => !skipDiff1.has(index))
      .map(({ entry, index }) => denormalizeDiff(diff1[index] ?? diff2[0], entry)),
    ...normalizedDiff2
      .map((entry, index) => ({ entry, index }))
      .filter(({ index }) => !skipDiff2.has(index))
      .map(({ entry, index }) => denormalizeDiff(diff2[index] ?? diff1[0], entry)),
  ]

  return { diffs, conflicts }
}
