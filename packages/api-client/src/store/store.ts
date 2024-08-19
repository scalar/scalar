import { PathId, fallbackMissingParams } from '@/router'
import {
  createStoreCollections,
  extendedCollectionDataFactory,
} from '@/store/collections'
import { createStoreCookies } from '@/store/cookies'
import {
  createStoreEnvironments,
  extendedEnvironmentDataFactory,
} from '@/store/environment'
import { importSpecFileFactory } from '@/store/import-spec'
import {
  createStoreRequestExamples,
  extendedExampleDataFactory,
} from '@/store/request-example'
import {
  createStoreRequests,
  extendedRequestDataFactory,
} from '@/store/requests'
import {
  createStoreSecuritySchemes,
  extendedSecurityDataFactory,
} from '@/store/security-schemes'
import { createStoreServers, extendedServerDataFactory } from '@/store/servers'
import type { StoreContext } from '@/store/store-context'
import { createStoreTags } from '@/store/tags'
import {
  createStoreWorkspaces,
  extendedWorkspaceDataFactory,
} from '@/store/workspace'
import { useModal } from '@scalar/components'
import type {
  Request,
  RequestEvent,
  RequestExample,
  SecurityScheme,
} from '@scalar/oas-utils/entities/spec'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import { computed, inject, reactive, ref } from 'vue'
import type { Router } from 'vue-router'

import { getRouterParams } from './router-params'

export type UpdateScheme = <P extends Path<SecurityScheme>>(
  path: P,
  value: NonNullable<PathValue<SecurityScheme, P>>,
) => void

/**
 * Factory for creating the entire store for the api-client
 * This should be injected once per app instance
 */
export const createWorkspaceStore = (
  router: Router,
  /** If true data will be persisted to localstorage when changes are made */
  useLocalStorage = true,
) => {
  /** Gives the required UID usually per route */
  const activeRouterParams = computed(getRouterParams(router))

  // ---------------------------------------------------------------------------
  // Initialize all storage objects

  const { collections, collectionMutators } =
    createStoreCollections(useLocalStorage)
  const { tags, tagMutators } = createStoreTags(useLocalStorage)
  const { requests, requestMutators } = createStoreRequests(useLocalStorage)
  const { requestExamples, requestExampleMutators } =
    createStoreRequestExamples(useLocalStorage)
  const { cookies, cookieMutators } = createStoreCookies(useLocalStorage)
  const { environments, environmentMutators } =
    createStoreEnvironments(useLocalStorage)
  const { servers, serverMutators } = createStoreServers(useLocalStorage)
  const { securitySchemes, securitySchemeMutators } =
    createStoreSecuritySchemes(useLocalStorage)
  const { workspaces, workspaceMutators } =
    createStoreWorkspaces(useLocalStorage)

  // ---------------------------------------------------------------------------
  // Extended Mutators - Adds side effects as needed

  // Provide the workspace to the extended mutator factories
  const storeContext: StoreContext = {
    routerParams: activeRouterParams,
    collections,
    collectionMutators,
    tags,
    tagMutators,
    requests,
    requestMutators,
    requestExamples,
    requestExampleMutators,
    cookies,
    cookieMutators,
    environments,
    environmentMutators,
    servers,
    serverMutators,
    securitySchemes,
    securitySchemeMutators,
    workspaces,
    workspaceMutators,
  }
  const { addRequest, deleteRequest } = extendedRequestDataFactory(storeContext)
  const { deleteEnvironment } = extendedEnvironmentDataFactory(storeContext)
  const { addServer, deleteServer } = extendedServerDataFactory(storeContext)
  const { addCollection, deleteCollection } =
    extendedCollectionDataFactory(storeContext)
  const { addRequestExample, deleteRequestExample } =
    extendedExampleDataFactory(storeContext)
  const { addWorkspace, deleteWorkspace } =
    extendedWorkspaceDataFactory(storeContext)
  const { addSecurityScheme, deleteSecurityScheme } =
    extendedSecurityDataFactory(storeContext)
  // ---------------------------------------------------------------------------
  // Active entities based on the router

  /** The currently selected workspace OR the first one */
  const activeWorkspace = computed(
    () =>
      workspaces[activeRouterParams.value[PathId.Workspace]] ??
      workspaces[Object.keys(workspaces)[0]],
  )

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

  /**
   * Request associated with the current route
   *
   * undefined must be handled as we may have no requests
   */
  const activeRequest = computed<Request | undefined>(() => {
    const key = activeRouterParams.value[PathId.Request]

    // Can use this fallback to get an active request
    // TODO: Do we really need this? We have to handle undefined anyways
    const workspace =
      workspaces[activeRouterParams.value.workspace] ??
      workspaces[Object.keys(workspaces)[0]]
    const collection =
      collections[activeRouterParams.value.collection] ??
      collections[workspace.collections[0]]

    const request = requests[key] ?? requests[collection.requests[0]]

    fallbackMissingParams(PathId.Request, request)

    return request
  })

  /** Currently active example */
  const activeExample = computed<RequestExample | undefined>(
    () => requestExamples[activeRouterParams.value[PathId.Examples]],
  )
  /**
   * First collection that the active request is in
   *
   * TODO we should add collection to the route and grab this from the params
   */
  const activeCollection = computed(() => {
    const requestUid = activeRequest.value?.uid
    if (requestUid)
      return Object.values(collections).find((c) =>
        c.requests.includes(requestUid),
      )

    const fallbackUid =
      activeWorkspace.value.collections[0] ?? collections[0].uid

    return collections[fallbackUid]
  })

  /** The currently selected server in the addressBar */
  const activeServer = computed(
    () =>
      activeCollection.value &&
      servers[activeCollection.value.selectedServerUid],
  )

  /** Cookie associated with the current route */
  const activeCookieId = computed<string | undefined>(
    () => activeRouterParams.value[PathId.Cookies],
  )

  /**
   * Active list all available substitution variables for
   * resolving {{ }} template syntax
   *
   * Servers function as a special form of env var
   */
  const activeEnvVariables = computed(() => {
    const flattenedServers = activeWorkspaceServers.value.map((server) => ({
      key: server.url,
      value: server.url,
    }))

    const flattenedEnvs = Object.values(environments)
      .map((env) => {
        try {
          return {
            _scalarEnvId: env.uid,
            ...JSON.parse(env.raw),
          }
        } catch {
          return null
        }
      })
      .filter((env) => env)
      .flatMap((obj) =>
        Object.entries(obj).flatMap(([key, value]) => {
          // Exclude the _scalarEnvId from the key-value pairs
          if (key !== '_scalarEnvId') {
            return [{ _scalarEnvId: obj._scalarEnvId, key, value }]
          }
          return []
        }),
      )

    return [...flattenedServers, ...flattenedEnvs]
  })

  // ---------------------------------------------------------------------------
  // OTHER HELPER DATA
  /** Running request history list */
  const requestHistory = reactive<RequestEvent[]>([])

  /** Most commonly used property of workspace, we don't need check activeWorkspace.value this way */
  const isReadOnly = computed(() => activeWorkspace.value?.isReadOnly ?? false)

  const { importSpecFile, importSpecFromUrl } =
    importSpecFileFactory(storeContext)

  /** Helper function to manage the sidebar width */
  const sidebarWidth = ref(localStorage.getItem('sidebarWidth') || '280px')

  // Set the sidebar width
  const setSidebarWidth = (width: string) => {
    sidebarWidth.value = width
    localStorage.setItem('sidebarWidth', width)
  }

  /** This state is to be used by the API Client Modal component to control the modal */
  const modalState = useModal()

  return {
    // ---------------------------------------------------------------------------
    // STATE
    workspaces,
    collections,
    tags,
    cookies,
    environments,
    requestExamples,
    requests,
    servers,
    securitySchemes,
    activeCollection,
    activeCookieId,
    activeExample,
    activeRequest,
    activeRouterParams,
    activeServer,
    activeWorkspace,
    activeWorkspaceCollections,
    activeWorkspaceServers,
    activeEnvVariables,
    activeWorkspaceRequests,
    modalState,
    isReadOnly,
    router,
    sidebarWidth,
    setSidebarWidth,
    // ---------------------------------------------------------------------------
    // METHODS
    importSpecFile,
    importSpecFromUrl,
    cookieMutators,
    collectionMutators: {
      ...collectionMutators,
      rawAdd: collectionMutators.add,
      add: addCollection,
      delete: deleteCollection,
    },
    tagMutators,
    environmentMutators: {
      ...environmentMutators,
      delete: deleteEnvironment,
    },
    requestMutators: {
      ...requestMutators,
      rawAdd: requestMutators.add,
      add: addRequest,
      delete: deleteRequest,
    },
    requestExampleMutators: {
      ...requestExampleMutators,
      rawAdd: requestExampleMutators.add,
      add: addRequestExample,
      delete: deleteRequestExample,
    },
    requestHistory,
    securitySchemeMutators: {
      ...securitySchemeMutators,
      rawAdd: securitySchemeMutators.add,
      add: addSecurityScheme,
      delete: deleteSecurityScheme,
    },
    serverMutators: {
      ...serverMutators,
      rawAdd: serverMutators.add,
      add: addServer,
      delete: deleteServer,
    },
    workspaceMutators: {
      ...workspaceMutators,
      rawAdd: workspaceMutators.add,
      add: addWorkspace,
      delete: deleteWorkspace,
    },
  }
}

export type WorkspaceStore = ReturnType<typeof createWorkspaceStore>

/**
 * Global hook which contains the store for the whole app
 * We may want to break this up at some point due to the massive file size
 *
 * The rawAdd methods are the mutator.add methods. Some add methods have been replaced when we need some side effects
 * ex: add examples when adding a request
 */
export const useWorkspace = () => inject<WorkspaceStore>('workspace')!
