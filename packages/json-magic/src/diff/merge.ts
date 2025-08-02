import { DifferenceResult, type Difference } from '@/diff/diff'
import { Trie } from '@/diff/trie'
import { isArrayEqual, isKeyCollisions, mergeObjects } from '@/diff/utils'

/**
 * Merges two DifferenceResult objects (as returned by the diff function) and resolves conflicts.
 * This function combines changes from two DifferenceResult.changeset arrays while handling potential conflicts
 * that arise when both diffs modify the same paths. It uses a trie data structure for
 * efficient path matching and conflict detection.
 *
 * @param diff1 - First DifferenceResult (as returned by diff)
 * @param diff2 - Second DifferenceResult (as returned by diff)
 * @returns Object containing:
 *   - diffs: DifferenceResult<T> with the combined list of non-conflicting differences
 *   - conflicts: Array of conflicting difference pairs (each as [Difference[], Difference[]]) that need manual resolution
 *
 * @example
 * // Merge two sets of changes to a user profile
 * const diff1 = diff(base, userA); // DifferenceResult
 * const diff2 = diff(base, userB); // DifferenceResult
 * const { diffs, conflicts } = merge(diff1, diff2)
 * // Returns:
 * // {
 * //   diffs: new DifferenceResult([
 * //     { path: ['age'], changes: 30, type: 'add' },
 * //     { path: ['address'], changes: { city: 'NY' }, type: 'add' }
 * //   ]),
 * //   conflicts: [
 * //     [
 * //       [{ path: ['name'], changes: 'John', type: 'update' }],
 * //       [{ path: ['name'], changes: 'Johnny', type: 'update' }]
 * //     ]
 * //   ]
 * // }
 */
export const merge = <T>(diff1: DifferenceResult<T>, diff2: DifferenceResult<T>) => {
  // Here we need to use a trie to optimize searching for a prefix
  // With the naive approach time complexity of the algorithm would be
  //                         O(n * m)
  //                           ^   ^
  // n is the length off diff1 |   | m length of diff2
  //
  // Assuming that the maximum depth of the nested objects would be constant lets say 0 <= D <= 100
  // we try to optimize for that using the tire data structure.
  // So the new time complexity would be O(n * D) where D is the maximum depth of the nested object
  const trie = new Trie<{ index: number; changes: Difference }>()

  // Create the trie
  for (const [index, diff] of diff1.changeset.entries()) {
    trie.addPath(diff.path, { index, changes: diff })
  }

  const skipDiff1 = new Set<number>()
  const skipDiff2 = new Set<number>()

  // Keep related conflicts together for easy A, B pick conflict resolution
  // map key is going to be conflicting index of first diff list where the diff will be
  // a delete operation or an add/update operation with a one to many conflicts
  const conflictsMap1 = new Map<number, [Difference[], Difference[]]>()
  // map key will be the index from the second diff list where the diff will be
  // a delete operation with one to many conflicts
  const conflictsMap2 = new Map<number, [Difference[], Difference[]]>()

  for (const [index, diff] of diff2.changeset.entries()) {
    trie.findMatch(diff.path, (value) => {
      if (diff.type === 'delete') {
        if (value.changes.type === 'delete') {
          // Keep the highest depth delete operation and skip the other
          if (value.changes.path.length > diff.path.length) {
            skipDiff1.add(value.index)
          } else {
            skipDiff2.add(value.index)
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

  const conflicts: [Difference[], Difference[]][] = [...conflictsMap1.values(), ...conflictsMap2.values()]

  // Filter all changes that should be skipped because of conflicts
  // or auto conflict resolution
  const diffs: DifferenceResult<T> = new DifferenceResult([
    ...diff1.changeset.filter((_, index) => !skipDiff1.has(index)),
    ...diff2.changeset.filter((_, index) => !skipDiff2.has(index)),
  ])

  return { diffs, conflicts }
}
