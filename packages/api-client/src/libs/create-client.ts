import { CLIENT_CONFIGURATION_SYMBOL } from '@/hooks/useClientConfig'
import { type ClientLayout, LAYOUT_SYMBOL } from '@/hooks/useLayout'
import { SIDEBAR_SYMBOL, createSidebarState } from '@/hooks/useSidebar'
import { getRequestUidByPathMethod } from '@/libs/get-request-uid-by-path-method'
import { loadAllResources } from '@/libs/local-storage'
import { PLUGIN_MANAGER_SYMBOL, createPluginManager } from '@/plugins'
import { ACTIVE_ENTITIES_SYMBOL, createActiveEntitiesStore } from '@/store/active-entities'
import { WORKSPACE_SYMBOL, type WorkspaceStore, createWorkspaceStore } from '@/store/store'
import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'
import { type Workspace, workspaceSchema } from '@scalar/oas-utils/entities/workspace'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { LS_KEYS } from '@scalar/helpers/object/local-storage'
import { DATA_VERSION, DATA_VERSION_LS_LEY } from '@scalar/oas-utils/migrations'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import { type ApiClientConfiguration, apiClientConfigurationSchema } from '@scalar/types/api-reference'
import type { OpenAPI } from '@scalar/types/legacy'
import { type Component, createApp, ref, watch } from 'vue'
import type { Router } from 'vue-router'

export type OpenClientPayload = (
  | {
      path: string
      method: OpenAPI.HttpMethod | Lowercase<OpenAPI.HttpMethod>
      requestUid?: never
    }
  | {
      path?: never
      method?: never
      requestUid: string
    }
) & {
  _source?: 'api-reference' | 'gitbook'
}

export type CreateApiClientParams = {
  /** Element to mount the references to */
  el: HTMLElement | null
  /** Main vue app component to create the vue app */
  appComponent: Component
  /** Configuration object for API client */
  configuration?: Partial<ApiClientConfiguration>
  /** Read only version of the client app */
  isReadOnly?: boolean
  /** Persist the workspace to localStoragfe */
  persistData?: boolean
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize?: boolean
  /** Instance of a vue router */
  router: Router
  /** In case the store has been instantiated beforehand */
  store?: WorkspaceStore | undefined
  /**
   * The layout of the client
   * @see {@link ClientLayout}
   */
  layout?: ClientLayout
}

/**
 * ApiClient type
 *
 * We need to do this due to some typescript type propogation errors
 * This is pretty much add properties as they are needed
 */
export type ApiClient = Omit<Awaited<ReturnType<typeof createApiClient>>, 'app' | 'store'> & {
  /** Add properties as they are needed, see above */
  app: { unmount: () => void }
  /**
   * The main workspace store from the client
   * These refs don't wanna play nice with typescript, if we need them we can de-reference them
   */
  store: Omit<WorkspaceStore, 'router' | 'events' | 'sidebarWidth' | 'proxyUrl' | 'requestHistory'>
}

/**
 * Sync method to create the api client vue app and store
 *
 * This method will NOT import the spec, just create the modal so you must use update/updateConfig before opening
 */
export const createApiClient = ({
  el,
  appComponent,
  configuration: _configuration = {},
  isReadOnly = false,
  store: _store,
  persistData = true,
  mountOnInitialize = true,
  layout = 'desktop',
  router,
}: CreateApiClientParams) => {
  // Parse the config
  const configuration = ref(apiClientConfigurationSchema.parse(_configuration))

  // Create the store if it wasn't passed in
  const store =
    _store ||
    createWorkspaceStore({
      proxyUrl: configuration.value.proxyUrl,
      theme: configuration.value.theme,
      showSidebar: configuration.value.showSidebar ?? true,
      hideClientButton: configuration.value.hideClientButton ?? false,
      _integration: configuration.value._integration,
      useLocalStorage: persistData,
    })

  // Create the router based active entities store
  const activeEntities = createActiveEntitiesStore({ ...store, router })

  // Create the sidebar state
  const sidebarState = createSidebarState({ layout })

  // Create the plugin manager
  const pluginManager = createPluginManager({
    plugins: configuration.value.plugins ?? [],
  })

  // Safely check for localStorage availability
  const hasLocalStorage = () => {
    try {
      return typeof window !== 'undefined' && window.localStorage !== undefined
    } catch {
      return false
    }
  }

  // Load from localStorage if available and enabled
  if (hasLocalStorage() && localStorage.getItem(LS_KEYS.WORKSPACE) && !isReadOnly) {
    try {
      const size: Record<string, string> = {}
      let _lsTotal = 0
      let _xLen = 0
      let _key = ''

      for (_key in localStorage) {
        if (!Object.prototype.hasOwnProperty.call(localStorage, _key)) {
          continue
        }
        _xLen = (localStorage[_key].length + _key.length) * 2
        _lsTotal += _xLen
        size[_key] = (_xLen / 1024).toFixed(2) + ' KB'
      }
      size['Total'] = (_lsTotal / 1024).toFixed(2) + ' KB'
      console.table(size)

      loadAllResources(store)
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }
  }
  // Create the default store
  else if (!isReadOnly && !configuration.value.url && !configuration.value.content) {
    // Create default workspace
    store.workspaceMutators.add({
      uid: 'default' as Workspace['uid'],
      name: 'Workspace',
      proxyUrl: configuration.value.proxyUrl,
    })

    if (hasLocalStorage()) {
      try {
        localStorage.setItem(DATA_VERSION_LS_LEY, DATA_VERSION)
      } catch (error) {
        console.warn('Failed to set localStorage version:', error)
      }
    }
  }
  // Add a barebones workspace if we want to load a spec in the modal
  else {
    const workspace = workspaceSchema.parse({
      uid: 'default',
      name: 'Workspace',
      proxyUrl: configuration.value.proxyUrl,
    })
    store.workspaceMutators.rawAdd(workspace)
  }

  const app = createApp(appComponent)
  app.use(router)
  // Provide the workspace store for the useWorkspace hook
  app.provide(WORKSPACE_SYMBOL, store)
  // Provide the layout for the useLayout hook
  app.provide(LAYOUT_SYMBOL, layout)
  // Provide the active entities store
  app.provide(ACTIVE_ENTITIES_SYMBOL, activeEntities)
  // Provide the sidebar state
  app.provide(SIDEBAR_SYMBOL, sidebarState)
  // Provide the client config
  app.provide(CLIENT_CONFIGURATION_SYMBOL, configuration)
  // Provide the plugin manager
  app.provide(PLUGIN_MANAGER_SYMBOL, pluginManager)
  // Set an id prefix for useId so we don't have collisions with other Vue apps
  app.config.idPrefix = 'scalar-client'

  const {
    collectionMutators,
    importSpecFile,
    importSpecFromUrl,
    modalState,
    requests,
    securitySchemes,
    securitySchemeMutators,
    servers,
    workspaceMutators,
    requestExampleMutators,
  } = store
  const { activeCollection, activeWorkspace } = activeEntities

  // Mount the vue app
  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.error(
        '[@scalar/api-client-modal] Could not create the API client.',
        'Invalid HTML element provided.',
        'Read more: https://github.com/scalar/scalar/tree/main/packages/api-client',
      )

      return
    }
    app.mount(mountingEl)
  }
  if (mountOnInitialize) {
    mount()
  }

  /** Route to the specified method and path */
  const route = (payload?: OpenClientPayload) => {
    // Find the request from path + method
    const resolvedRequestUid = getRequestUidByPathMethod(requests, payload)

    // Redirect to the request
    if (resolvedRequestUid) {
      router.push({
        name: 'request',
        query: payload?._source ? { source: payload._source } : {},
        params: {
          workspace: 'default',
          request: resolvedRequestUid,
        },
      })
    } else {
      console.warn('[@scalar/api-client] Could not find request for path and method', payload)
    }
  }

  /** Reset the client store */
  const resetStore = () => {
    store.collectionMutators.reset()
    store.requestMutators.reset()
    store.requestExampleMutators.reset()
    store.securitySchemeMutators.reset()
    store.serverMutators.reset()
    store.tagMutators.reset()
    workspaceMutators.edit(activeWorkspace.value?.uid, 'collections', [])
  }

  return {
    /** The vue app instance for the modal, be careful with this */
    app,
    resetStore,
    /**
     * Update the API client config
     *
     * Deletes the current store before importing again for now, in the future will Diff and only update what is needed
     */
    updateConfig: async (_newConfig: Partial<ApiClientConfiguration>) => {
      const newConfig = apiClientConfigurationSchema.parse(_newConfig)

      // When to rigger rebuilding the store (until we diff) this is just a temp hack BUT do not put anything that
      // has a default here as it will always trigger as the config has already been parsed
      if (
        newConfig.url ||
        newConfig.content ||
        newConfig.servers ||
        newConfig.authentication ||
        newConfig.slug ||
        newConfig.title ||
        newConfig.baseServerURL ||
        newConfig.proxyUrl ||
        newConfig.showSidebar
      ) {
        // Update the spec, reset the store first
        resetStore()

        /** Add any extra properties to the config */
        const config = {
          ...newConfig,
          useCollectionSecurity: isReadOnly,
        }

        // Update the config ref
        configuration.value = config

        if (newConfig.url) {
          await importSpecFromUrl(newConfig.url, activeWorkspace.value?.uid ?? 'default', config)
        } else if (newConfig.content) {
          await importSpecFile(newConfig.content, activeWorkspace.value?.uid ?? 'default', config)
        } else {
          console.error(
            '[@scalar/api-client-modal] Could not create the API client.',
            'Please provide an OpenAPI document: { url: "…" }',
            'Read more: https://github.com/scalar/scalar/tree/main/packages/api-client',
          )
        }
      }
    },
    /** Update the currently selected server via URL */
    updateServer: (serverUrl: string) => {
      const server = Object.values(servers).find((s) => s.url === serverUrl)

      if (server && activeCollection.value) {
        collectionMutators.edit(activeCollection.value?.uid, 'selectedServerUid', server.uid)
      }
    },
    /** Update the currently selected server via URL */
    onUpdateServer: (callback: (url: string) => void) => {
      watch(
        () => activeCollection.value?.selectedServerUid,
        (uid) => {
          const server = Object.values(servers).find((s) => s.uid === uid)
          if (server?.url) {
            callback(server.url)
          }
        },
      )
    },
    /**
     * Update the auth values, we currently don't change the auth selection
     */
    updateAuth: <P extends Path<SecurityScheme>>({
      nameKey,
      propertyKey,
      value,
    }: {
      nameKey: string
      propertyKey: P
      value: NonNullable<PathValue<SecurityScheme, P>>
    }) => {
      const schemes = Object.values(securitySchemes)
      const scheme = schemes.find((s) => s.nameKey === nameKey)

      if (scheme) {
        securitySchemeMutators.edit(scheme.uid, propertyKey, value)
      }
    },
    /** Route to a method + path */
    route,

    /** Open the API client modal and optionally route to a request */
    open: (payload?: OpenClientPayload) => {
      const { method, path, requestUid } = payload ?? {}
      if ((method && path) || requestUid) {
        route(payload)
      }

      // Open the modal
      modalState.open = true
    },
    /** Mount the references to a given element */
    mount,
    /** State for controlling the modal */
    modalState,
    /* The workspace store */
    store,
    /** Update the currently selected example */
    updateExample: (exampleKey: string, operationId: string) => {
      if (!exampleKey || !operationId) {
        return
      }

      const request = Object.values(requests).find(
        ({ operationId: reqOperationId, path }) => reqOperationId === operationId || path === operationId,
      )
      if (!request) {
        return
      }

      const contentType = Object.keys(request.requestBody?.content || {})[0] || ''
      const example = request.requestBody?.content?.[contentType]?.examples?.[exampleKey]
      if (!example) {
        return
      }

      requestExampleMutators.edit(request.examples[0], 'body.raw.value', prettyPrintJson(example.value))
    },
  }
}
