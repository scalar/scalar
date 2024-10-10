import { Mutation } from '@/mutator-record/mutations'
import type { Path, PathValue } from '@/nested'
import { stringify } from 'flatted'

import { debounce } from './debounce'
import { LS_CONFIG } from './local-storage'

const MAX_MUTATION_RECORDS = 500

/** Generate mutation handlers for a given record of objects  */
export function mutationFactory<
  T extends Record<string, any> & { uid: string },
>(
  entityMap: Partial<Record<string, T>>,
  mutationMap: Partial<Record<string, Mutation<T>>>,
  localStorageKey?: string | false,
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

  /** Triggers on any changes so we can save to localStorage */
  const onChange = localStorageKey
    ? debounce(
        () => localStorage.setItem(localStorageKey, stringify(entityMap)),
        LS_CONFIG.DEBOUNCE_MS,
        { maxWait: LS_CONFIG.MAX_WAIT_MS },
      )
    : () => null

  /** Adds a new item to the record of tracked items and creates a new mutation tracking instance */
  const add = (item: T) => {
    entityMap[item.uid] = item
    mutationMap[item.uid] = new Mutation(item, maxNumberRecords)
    onChange()
  }

  return {
    /** Adds a new item to the record of tracked items and creates a new mutation tracking instance */
    add,
    delete: (uid: string) => {
      delete entityMap[uid]
      delete mutationMap[uid]
      onChange()
    },
    /** Destructive, overwrites a record to a new item and creates a new mutation tracking instance */
    set: (item: T) => {
      entityMap[item.uid] = item
      mutationMap[item.uid] = new Mutation(item, maxNumberRecords)
      onChange()
    },
    /** Update a nested property and track the mutation */
    edit: <P extends Path<T>>(uid: string, path: P, value: PathValue<T, P>) => {
      const mutator = getMutator(uid)
      mutator?.mutate(path, value)
      onChange()
    },
    /** Commit an untracked edit to the object (undo/redo will not work) */
    untrackedEdit: <P extends Path<T>>(
      uid: string,
      path: P,
      value: PathValue<T, P>,
    ) => {
      const mutator = getMutator(uid)
      mutator?._unsavedMutate(path, value)
      onChange()
    },
    /** Undo the last mutation */
    undo: (uid: string) => {
      const mutator = getMutator(uid)
      mutator?.undo()
      onChange()
    },
    /** Redo a mutation if available */
    redo: (uid: string) => {
      const mutator = getMutator(uid)
      mutator?.redo()
      onChange()
    },
  }
}

export type Mutators<T extends object & { uid: string }> = ReturnType<
  typeof mutationFactory<T>
>
