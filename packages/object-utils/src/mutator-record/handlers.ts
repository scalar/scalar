import { Mutation } from '@/mutator-record/mutations'
import type { Path, PathValue } from '@/nested'
import { useDebounceFn } from '@vueuse/core'
import type { ValueOf } from 'type-fest'

import type { LS_CONFIG, LS_KEYS } from './local-storage'

const MAX_MUTATION_RECORDS = 500

/** Generate mutation handlers for a given record of objects  */
export function mutationFactory<
  T extends Record<string, any> & { uid: string },
>(
  entityMap: Partial<Record<string, T>>,
  mutationMap: Partial<Record<string, Mutation<T>>>,
  localStorageKey?: ValueOf<typeof LS_KEYS>,
  maxNumberRecords: number = MAX_MUTATION_RECORDS,
) {
  console.log('creating', localStorageKey)

  function getMutator(uid: string) {
    const mutator = mutationMap[uid]

    if (!mutator)
      console.warn(
        `Missing ${entityMap[uid] ? 'mutator' : 'object'} for uid: ${uid}`,
      )

    return mutator ?? null
  }

  /** Triggers on any action to the mutator */
  // todo this debounce is not working
  const onChange = localStorageKey
    ? useDebounceFn(
        () => {
          localStorage.setItem(localStorageKey, JSON.stringify(entityMap))
        },
        100000,
        { maxWait: 500 },
      )
    : () => null

  return {
    /** Adds a new item to the record of tracked items and creates a new mutation tracking instance */
    add: (item: T) => {
      entityMap[item.uid] = item
      mutationMap[item.uid] = new Mutation(item, maxNumberRecords)
      console.log('adding', localStorageKey, item)
      onChange()
    },
    delete: (uid: string) => {
      delete entityMap[uid]
      delete mutationMap[uid]
      console.log('deleting', localStorageKey)
      onChange()
    },
    /** Destructive, overwrites a record to a new item and creates a new mutation tracking instance */
    set: (item: T) => {
      entityMap[item.uid] = item
      mutationMap[item.uid] = new Mutation(item, maxNumberRecords)
      console.log('set', localStorageKey, item)
      onChange()
    },
    /** Update a nested property and track the mutation */
    edit: <P extends Path<T>>(uid: string, path: P, value: PathValue<T, P>) => {
      const mutator = getMutator(uid)
      mutator?.mutate(path, value)
      console.log('edit', localStorageKey, path)
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
      console.log('untracked edit', localStorageKey)
      onChange()
    },
    /** Undo the last mutation */
    undo: (uid: string) => {
      const mutator = getMutator(uid)
      mutator?.undo()
      console.log('undo', localStorageKey)
      onChange()
    },
    /** Redo a mutation if available */
    redo: (uid: string) => {
      const mutator = getMutator(uid)
      mutator?.redo()
      console.log('redo', localStorageKey)
      onChange()
    },
  }
}
