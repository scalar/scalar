import { flattenEnvVars } from '@/libs/string-template'
import { PathId } from '@/router'
import { useWorkspace } from '@/store'
import type { Request, RequestExample } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { getRouterParams } from '../store/router-params'

/**
 * Hook for the active entities store
 *
 * This store returns anything related to the currently active entities
 */
export const useActiveEntities = () => {
  const {
    workspaces,
    collections,
    environments,
    requestExamples,
    requests,
    servers,
  } = useWorkspace()
  const router = useRouter()

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

  /** TODO: need to merge collection environments into the global space */
  const activeEnvironment = computed(
    () => environments[activeWorkspace.value?.activeEnvironmentId ?? 'default'],
  )

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
    // TODO: Must merge global variables and collection level variables here
    // Return a list of key value pairs that includes dot nested paths
    return flattenEnvVars(JSON.parse(activeEnvironment.value.value)).map(
      ([key, value]) => ({
        key,
        value,
      }),
    )
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
    router,
  }
}
