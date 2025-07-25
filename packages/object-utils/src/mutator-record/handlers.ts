import { Mutation } from '../mutator-record/mutations'
import type { Path, PathValue } from '../nested'
import { stringify } from 'flatted'
import { safeLocalStorage } from '@scalar/helpers/object/local-storage'
import { debounce } from './debounce'
import { LS_CONFIG } from './local-storage'

const MAX_MUTATION_RECORDS = 500

/** Generate mutation handlers for a given record of objects  */
export function mutationFactory<T extends Record<string, any>>(
  entityMap: Partial<Record<string, T>>,
  mutationMap: Partial<Record<string, Mutation<T>>>,
  localStorageKey?: string | false,
  maxNumberRecords: number = MAX_MUTATION_RECORDS,
) {
  function getMutator(uid: T['uid']) {
    const mutator = mutationMap[uid]

    if (!mutator) {
      console.warn(`Missing ${entityMap[uid] ? 'mutator' : 'object'} for uid: ${uid}`)
    }

    return mutator ?? null
  }

  /** Triggers on any changes so we can save to localStorage */
  const onChange = localStorageKey
    ? debounce(() => safeLocalStorage().setItem(localStorageKey, stringify(entityMap)), LS_CONFIG.DEBOUNCE_MS, {
        maxWait: LS_CONFIG.MAX_WAIT_MS,
      })
    : () => null

  return {
    /** Adds a new item to the record of tracked items and creates a new mutation tracking instance */
    add: (item: T) => {
      entityMap[item.uid] = item
      mutationMap[item.uid] = new Mutation(item, maxNumberRecords)
      onChange()
    },
    delete: (uid: T['uid'] | null | undefined) => {
      if (!uid) {
        console.warn('[@scalar/object-utils] No uid provided to delete')
        return
      }
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
    edit: <P extends Path<T>>(uid: T['uid'] | null | undefined, path: P, value: PathValue<T, P>) => {
      if (!uid) {
        console.warn('[@scalar/object-utils] No uid provided to edit', path, value)
        return
      }
      const mutator = getMutator(uid)
      mutator?.mutate(path, value)
      onChange()
    },
    /** Commit an untracked edit to the object (undo/redo will not work) */
    untrackedEdit: <P extends Path<T>>(uid: T['uid'], path: P, value: PathValue<T, P>) => {
      const mutator = getMutator(uid)
      mutator?._unsavedMutate(path, value)
      onChange()
    },
    /** Undo the last mutation */
    undo: (uid: T['uid']) => {
      const mutator = getMutator(uid)
      mutator?.undo()
      onChange()
    },
    /** Redo a mutation if available */
    redo: (uid: T['uid']) => {
      const mutator = getMutator(uid)
      mutator?.redo()
      onChange()
    },
    /** Destructive, clears the record */
    reset: () => {
      Object.keys(entityMap).forEach((uid) => {
        delete entityMap[uid]
        delete mutationMap[uid]
      })
      onChange()
    },
  }
}

export type Mutators<T extends object> = ReturnType<typeof mutationFactory<T>>
