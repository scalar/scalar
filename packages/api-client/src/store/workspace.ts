import type { StoreContext } from '@/store/store-context'
import {
  collectionSchema,
  requestExampleSchema,
  requestSchema,
} from '@scalar/oas-utils/entities/spec'
import {
  type Workspace,
  workspaceSchema,
} from '@scalar/oas-utils/entities/workspace'
import { LS_KEYS } from '@scalar/oas-utils/helpers'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Create storage for workspace entities */
export function createStoreWorkspaces(useLocalStorage: boolean) {
  /** Active workspace object (will be associated with an entry in the workspace collection) */
  const workspaces = reactive<Record<string, Workspace>>({})
  const workspaceMutators = mutationFactory(
    workspaces,
    reactive({}),
    useLocalStorage && LS_KEYS.WORKSPACE,
  )

  return {
    workspaces,
    workspaceMutators,
  }
}

/** Workspace entities that require store context */
export function extendedWorkspaceDataFactory({
  workspaces,
  workspaceMutators,
  collectionMutators,
  requestMutators,
  requestExampleMutators,
}: StoreContext) {
  const addWorkspace = (payload: Partial<Workspace> = {}) => {
    // Create some example data
    const example = requestExampleSchema.parse({ name: 'Example' })
    const request = requestSchema.parse({
      method: 'get',
      parameters: [],
      path: '',
      summary: 'My First Request',
      examples: [example.uid],
    })
    const collection = collectionSchema.parse({
      info: {
        title: 'Drafts',
      },
      children: [request.uid],
      requests: [request.uid],
    })

    const workspace = workspaceSchema.parse({
      ...payload,
      collections: [collection.uid],
    })

    // Add all entities
    requestExampleMutators.add(example)
    requestMutators.add(request)
    collectionMutators.add(collection)
    workspaceMutators.add(workspace)

    return workspace
  }

  /** Prevent deletion of the default workspace */
  const deleteWorkspace = (uid: string) => {
    if (Object.keys(workspaces).length <= 1) {
      console.warn('The last workspace cannot be deleted.')
      return
    }
    workspaceMutators.delete(uid)
  }

  return {
    addWorkspace,
    deleteWorkspace,
  }
}
