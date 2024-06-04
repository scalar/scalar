import { Mutation } from '@/mutator-record/mutations'
import type { Path, PathValue } from '@/nested'

const MAX_MUTATION_RECORDS = 500

/** Generate mutation handlers for a given record of objects  */
export function mutationFactory<
  T extends Record<string, any> & { uid: string },
>(
  entityMap: Partial<Record<string, T>>,
  mutationMap: Partial<Record<string, Mutation<T>>>,
  maxNumberRecords: number = MAX_MUTATION_RECORDS,
) {
  function getMutator(uid: string) {
    const mutator = mutationMap[uid]

    if (!mutator)
      console.warn(
        `Missing ${entityMap[uid] ? 'mutator' : 'object'} for uid: ${uid}`,
      )

    return mutator ?? null
  }
  return {
    /** Adds a new item to the record of tracked items and creates a new mutation tracking instance */
    add: (item: T) => {
      entityMap[item.uid] = item
      mutationMap[item.uid] = new Mutation(item, maxNumberRecords)
    },
    delete: (uid: string) => {
      delete entityMap[uid]
      delete mutationMap[uid]
    },
    /** Update a nested property and track the mutation */
    edit: <P extends Path<T>>(uid: string, path: P, value: PathValue<T, P>) => {
      const mutator = getMutator(uid)
      mutator?.mutate(path, value)
    },
    /** Commit an untracked edit to the object (undo/redo will not work) */
    untrackedEdit: <P extends Path<T>>(
      uid: string,
      path: P,
      value: PathValue<T, P>,
    ) => {
      const mutator = getMutator(uid)
      mutator?._unsavedMutate(path, value)
    },
    /** Undo the last mutation */
    undo: (uid: string) => {
      const mutator = getMutator(uid)
      mutator?.undo()
    },
    /** Redo a mutation if available */
    redo: (uid: string) => {
      const mutator = getMutator(uid)
      mutator?.redo()
    },
  }
}
