import { createStoreCollections, extendedCollectionDataFactory } from '@/store/collections'
import { createStoreCookies } from '@/store/cookies'
import { createStoreEnvironments, extendedEnvironmentDataFactory } from '@/store/environment'
import { createStoreEvents } from '@/store/events'
import { importSpecFileFactory } from '@/store/import-spec'
import { createStoreRequestExamples, extendedExampleDataFactory } from '@/store/request-example'
import { createStoreRequests, extendedRequestDataFactory } from '@/store/requests'
import { createStoreSecuritySchemes, extendedSecurityDataFactory } from '@/store/security-schemes'
import { createStoreServers, extendedServerDataFactory } from '@/store/servers'
import type { StoreContext } from '@/store/store-context'
import { createStoreTags, extendedTagDataFactory } from '@/store/tags'
import { createStoreWorkspaces, extendedWorkspaceDataFactory } from '@/store/workspace'
import { useModal } from '@scalar/components'
import type { RequestEvent, SecurityScheme } from '@scalar/oas-utils/entities/spec'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { type InjectionKey, inject, reactive, ref, toRaw } from 'vue'

export type UpdateScheme = <P extends Path<SecurityScheme>>(
  path: P,
  value: NonNullable<PathValue<SecurityScheme, P>>,
) => void

declare global {
  interface Window {
    dataDump: () => void
  }
}

export type CreateWorkspaceStoreOptions = {
  /**
   * When true, changes made to the store will be saved in the browser's localStorage.
   *
   * @default true
   */
  useLocalStorage: boolean
} & Pick<ApiReferenceConfiguration, 'proxyUrl' | 'showSidebar' | 'hideClientButton' | 'theme' | '_integration'>

/**
 * Factory function for creating the centralized store for the API client.
 *
 * This store manages all data and state for the application.
 * It should be instantiated once and injected into the app's root component.
 */
export const createWorkspaceStore = ({
  useLocalStorage = true,
  showSidebar = true,
  proxyUrl,
  theme,
  hideClientButton = false,
  _integration,
}: CreateWorkspaceStoreOptions) => {
  // ---------------------------------------------------------------------------
  // Initialize all storage objects

  const { collections, collectionMutators } = createStoreCollections(useLocalStorage)
  const { tags, tagMutators } = createStoreTags(useLocalStorage)
  const { requests, requestMutators } = createStoreRequests(useLocalStorage)
  const { requestExamples, requestExampleMutators } = createStoreRequestExamples(useLocalStorage)
  const { cookies, cookieMutators } = createStoreCookies(useLocalStorage)
  const { environments, environmentMutators } = createStoreEnvironments(useLocalStorage)
  const { servers, serverMutators } = createStoreServers(useLocalStorage)
  const { securitySchemes, securitySchemeMutators } = createStoreSecuritySchemes(useLocalStorage)
  const { workspaces, workspaceMutators } = createStoreWorkspaces(useLocalStorage)

  // ---------------------------------------------------------------------------
  // Extended Mutators - Adds side effects as needed

  // Provide the workspace to the extended mutator factories
  const storeContext: StoreContext = {
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
  const { addTag, deleteTag } = extendedTagDataFactory(storeContext)
  const { addRequest, deleteRequest, findRequestParents } = extendedRequestDataFactory(storeContext, addTag)
  const { deleteEnvironment } = extendedEnvironmentDataFactory(storeContext)
  const { addServer, deleteServer } = extendedServerDataFactory(storeContext)
  const { addCollection, deleteCollection } = extendedCollectionDataFactory(storeContext)
  const { addRequestExample, deleteRequestExample } = extendedExampleDataFactory(storeContext)
  const { addWorkspace, deleteWorkspace } = extendedWorkspaceDataFactory(storeContext)
  const { addSecurityScheme, deleteSecurityScheme } = extendedSecurityDataFactory(storeContext)
  const { addCollectionEnvironment, removeCollectionEnvironment } = extendedCollectionDataFactory(storeContext)

  // ---------------------------------------------------------------------------
  // OTHER HELPER DATA
  /** Running request history list */
  const requestHistory = reactive<RequestEvent[]>([])

  const { importSpecFile, importSpecFromUrl } = importSpecFileFactory(storeContext)

  /** Helper function to manage the sidebar width */
  const sidebarWidth = ref((useLocalStorage ? localStorage?.getItem('sidebarWidth') : undefined) || '280px')

  // Set the sidebar width
  const setSidebarWidth = (width: string) => {
    sidebarWidth.value = width
    if (useLocalStorage) {
      localStorage?.setItem('sidebarWidth', width)
    }
  }

  /** This state is to be used by the API Client Modal component to control the modal */
  const modalState = useModal()

  // Set some defaults on all workspaces
  Object.values(workspaces).forEach(({ uid }) => {
    if (proxyUrl) {
      workspaceMutators.edit(uid, 'proxyUrl', proxyUrl)
    }
    if (theme) {
      workspaceMutators.edit(uid, 'themeId', theme)
    }
  })

  /**
   * For debugging purposes, expose this method for dumping the data stores
   */
  if (typeof window !== 'undefined') {
    window.dataDump = () => ({
      collections: toRaw(collections),
      cookies: toRaw(cookies),
      environments: toRaw(environments),
      requestExamples: toRaw(requestExamples),
      requests: toRaw(requests),
      securitySchemes: toRaw(securitySchemes),
      servers: toRaw(servers),
      tags: toRaw(tags),
      workspaces: toRaw(workspaces),
    })
  }

  // ---------------------------------------------------------------------------
  // Events Busses
  const events = createStoreEvents()

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
    modalState,
    events,
    sidebarWidth,
    setSidebarWidth,
    proxyUrl,
    // ---------------------------------------------------------------------------
    // CONFIGURATION "PROPS"
    // TODO: move these to their own store
    hideClientButton,
    showSidebar,
    integration: _integration,
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
      addEnvironment: addCollectionEnvironment,
      removeEnvironment: removeCollectionEnvironment,
    },
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
    findRequestParents,
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
    tagMutators: {
      ...tagMutators,
      rawAdd: tagMutators.add,
      add: addTag,
      delete: deleteTag,
    },
    workspaceMutators: {
      ...workspaceMutators,
      rawAdd: workspaceMutators.add,
      add: addWorkspace,
      delete: deleteWorkspace,
    },
    addCollectionEnvironment,
    removeCollectionEnvironment,
  }
}

export type WorkspaceStore = ReturnType<typeof createWorkspaceStore>
export const WORKSPACE_SYMBOL = Symbol() as InjectionKey<WorkspaceStore>

/**
 * Global hook which contains the store for the whole app
 *
 * The rawAdd methods are the mutator.add methods. Some add methods have been replaced when we need some side effects
 * ex: add examples when adding a request
 */
export const useWorkspace = (): WorkspaceStore => {
  const store = inject(WORKSPACE_SYMBOL)
  if (!store) {
    throw new Error('Workspace store not provided')
  }
  return store
}
