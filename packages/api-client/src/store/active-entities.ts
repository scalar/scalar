import { flattenEnvVars } from '@/libs/string-template'
import { PathId } from '@/router'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type {
  Collection,
  Request,
  RequestExample,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { type InjectionKey, computed, inject } from 'vue'
import type { Router } from 'vue-router'

import { getRouterParams } from './router-params'

type CreateActiveEntitiesStoreParams = {
  router: Router
  collections: Record<string, Collection>
  environments: Record<string, Environment>
  requestExamples: Record<string, RequestExample>
  requests: Record<string, Request>
  servers: Record<string, Server>
  workspaces: Record<string, Workspace>
}

/**
 * Create the active entities store
 *
 * We need the factory function to pass the router instance
 */
export const createActiveEntitiesStore = ({
  collections,
  environments,
  requestExamples,
  requests,
  router,
  servers,
  workspaces,
}: CreateActiveEntitiesStoreParams) => {
  /** Gives the required UID usually per route */
  const activeRouterParams = computed(getRouterParams(router))

  /** The currently selected workspace OR the first one */
  const activeWorkspace = computed(() => {
    const workspace =
      workspaces[activeRouterParams.value[PathId.Workspace]] ??
      workspaces[Object.keys(workspaces)[0]]

    return workspace
  })

  /** Ordered list of the active workspace's collections with drafts last */
  const activeWorkspaceCollections = computed(() =>
    activeWorkspace.value?.collections
      .map((uid) => collections[uid])
      .sort((a, b) => {
        if (a.info?.title === 'Drafts') return 1
        if (b.info?.title === 'Drafts') return -1
        return 0
      }),
  )

  /** Simplified list of servers in the workspace for displaying */
  const activeWorkspaceServers = computed(() =>
    activeWorkspaceCollections.value?.flatMap((collection) =>
      collection.servers.map((uid) => servers[uid]),
    ),
  )

  /** Simplified list of requests in the workspace for displaying */
  const activeWorkspaceRequests = computed(() =>
    activeWorkspaceCollections.value?.flatMap(
      (collection) => collection.requests,
    ),
  )

  /** The currently selected environment */
  const activeEnvironment = computed(() => {
    if (!activeWorkspace.value.activeEnvironmentId) {
      return ''
    }

    const activeEnvironmentCollection = activeWorkspaceCollections.value.find(
      (c) =>
        c['x-scalar-environments']?.[activeWorkspace.value.activeEnvironmentId],
    )

    if (activeEnvironmentCollection) {
      return {
        uid: activeWorkspace.value.activeEnvironmentId,
        name: activeWorkspace.value.activeEnvironmentId,
        value: JSON.stringify(
          activeEnvironmentCollection['x-scalar-environments']?.[
            activeWorkspace.value.activeEnvironmentId
          ].variables,
          null,
          2,
        ),
        color:
          activeEnvironmentCollection['x-scalar-environments']?.[
            activeWorkspace.value.activeEnvironmentId
          ].color,
        isDefault: false,
      }
    }

    return {
      uid: 'default',
      name: 'Global Environment',
      value: JSON.stringify(activeWorkspace.value.environments, null, 2),
    }
  })

  /**
   * Sets the active environment
   */
  const setActiveEnvironment = (uid?: string) => {
    if (!uid) {
      activeWorkspace.value.activeEnvironmentId = ''
      return
    }

    if (uid === 'default') {
      // Global environment
      activeWorkspace.value.activeEnvironmentId = 'default'
    } else {
      // Collection environment
      activeWorkspace.value.activeEnvironmentId = uid
    }
  }

  /**
   * Request associated with the current route
   *
   * undefined must be handled as we may have no requests
   */
  const activeRequest = computed<Request | undefined>(() => {
    const key = activeRouterParams.value[PathId.Request]

    // Can use this fallback to get an active request
    // TODO: Do we really need this? We have to handle undefined anyways
    const collection =
      collections[activeRouterParams.value.collection] ||
      collections[activeWorkspace.value.collections[0]]

    return requests[key] || requests[collection?.requests[0]]
  })

  /** Grabs the currently active example using the path param */
  const activeExample = computed<RequestExample | undefined>(() => {
    const key =
      activeRouterParams.value[PathId.Examples] === 'default'
        ? activeRequest.value?.examples[0] || ''
        : activeRouterParams.value[PathId.Examples]

    return requestExamples[key]
  })

  /**
   * First collection that the active request is in
   *
   * TODO we should add collection to the route and grab this from the params
   */
  const activeCollection = computed(() => {
    const requestUid = activeRequest.value?.uid
    if (requestUid)
      return Object.values(collections).find((c) =>
        c.requests?.includes(requestUid),
      )

    const fallbackUid =
      activeWorkspace.value.collections[0] ?? collections[0]?.uid

    return collections[fallbackUid]
  })

  /** The currently selected server in the addressBar */
  const activeServer = computed(
    () =>
      servers[
        activeRequest.value?.selectedServerUid ||
          activeCollection.value?.selectedServerUid ||
          ''
      ],
  )

  /** Cookie associated with the current route */
  const activeCookieId = computed<string | undefined>(
    () => activeRouterParams.value[PathId.Cookies],
  )

  /**
   * Active list all available substitution variables. Server variables
   * will be populated into the environment on spec loading
   */
  const activeEnvVariables = computed(() => {
    if (!activeEnvironment.value) return []
    const globalEnvironment = activeWorkspace.value.environments
    const collectionEnvironment = JSON.parse(activeEnvironment.value.value)
    const mergedEnvironment = { ...globalEnvironment, ...collectionEnvironment }
    return flattenEnvVars(mergedEnvironment).map(([key, value]) => ({
      key,
      value,
    }))
  })

  return {
    activeCollection,
    activeCookieId,
    activeExample,
    activeRequest,
    activeRouterParams,
    activeEnvironment,
    activeServer,
    activeWorkspace,
    activeWorkspaceCollections,
    activeWorkspaceServers,
    activeEnvVariables,
    activeWorkspaceRequests,
    setActiveEnvironment,
    router,
  }
}

export type ActiveEntitiesStore = ReturnType<typeof createActiveEntitiesStore>
export const ACTIVE_ENTITIES_SYMBOL =
  Symbol() as InjectionKey<ActiveEntitiesStore>

/**
 * The active entities store
 *
 * This store returns anything related to the currently active entities
 * The only reason this is a store and not a simple hook is due to storing the current router here
 */
export const useActiveEntities = (): ActiveEntitiesStore => {
  const store = inject(ACTIVE_ENTITIES_SYMBOL)
  if (!store) throw new Error('Active entities store not provided')
  return store
}
