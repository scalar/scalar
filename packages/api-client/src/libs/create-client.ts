import { loadAllResources } from '@/libs/local-storage'
import { createWorkspaceStore } from '@/store'
import type { Collection, RequestMethod } from '@scalar/oas-utils/entities/spec'
import { workspaceSchema } from '@scalar/oas-utils/entities/workspace'
import { LS_KEYS, objectMerge } from '@scalar/oas-utils/helpers'
import { DATA_VERSION, DATA_VERSION_LS_LEY } from '@scalar/oas-utils/migrations'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import type {
  AuthenticationState,
  ReferenceConfiguration,
  SpecConfiguration,
} from '@scalar/types/legacy'
import type { LiteralUnion } from 'type-fest'
import { type Component, createApp, watch } from 'vue'
import type { Router } from 'vue-router'

/** Configuration options for the Scalar API client */
export type ClientConfiguration = {
  proxyUrl?: ReferenceConfiguration['proxy']
  themeId?: ReferenceConfiguration['theme']
  preferredSecurityScheme?: AuthenticationState['preferredSecurityScheme']
} & Pick<
  ReferenceConfiguration,
  'spec' | 'showSidebar' | 'servers' | 'searchHotKey'
>

export type OpenClientPayload = {
  path: string
  method: LiteralUnion<RequestMethod | Lowercase<RequestMethod>, string>
}

type CreateApiClientParams = {
  /** Element to mount the references to */
  el: HTMLElement | null
  /** Main vue app component to create the vue app */
  appComponent: Component
  /** Configuration object for API client */
  configuration?: Partial<Pick<ClientConfiguration, 'spec'>> &
    ClientConfiguration
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
}

export type ApiClient = ReturnType<typeof createApiClient>

/**
 * Sync method to create the api client vue app and store
 *
 * This method will NOT import the spec, just create the modal so you must use update/updateConfig before opening
 */
export const createApiClient = ({
  el,
  appComponent,
  configuration = {},
  isReadOnly = false,
  persistData = true,
  mountOnInitialize = true,
  router,
}: CreateApiClientParams) => {
  const store = createWorkspaceStore(router, persistData)

  // Load from localStorage if available
  // Check if we have localStorage data
  if (localStorage.getItem(LS_KEYS.WORKSPACE) && !isReadOnly) {
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
  }
  // Create the default store
  else if (!isReadOnly || !configuration.spec) {
    // Create default workspace
    store.workspaceMutators.add({
      uid: 'default',
      name: 'Workspace',
      isReadOnly,
      proxyUrl: configuration.proxyUrl,
    })

    localStorage.setItem(DATA_VERSION_LS_LEY, DATA_VERSION)
  }
  // Add a barebones workspace if we want to load a spec in the modal
  else {
    const workspace = workspaceSchema.parse({
      uid: 'default',
      name: 'Workspace',
      isReadOnly: true,
      proxyUrl: configuration.proxyUrl,
    })
    store.workspaceMutators.rawAdd(workspace)
  }

  const app = createApp(appComponent)
  app.use(router)
  app.provide('workspace', store)

  const {
    activeCollection,
    activeWorkspace,
    collectionMutators,
    importSpecFile,
    importSpecFromUrl,
    modalState,
    requests,
    securitySchemes,
    servers,
    workspaceMutators,
  } = store

  // Mount the vue app
  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.error(
        `[@scalar/api-client-modal] Could not create the API client.`,
        `Invalid HTML element provided.`,
        `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client`,
      )

      return
    }
    app.mount(mountingEl)
  }

  // Update some workspace params from the config
  if (activeWorkspace.value) {
    if (mountOnInitialize) mount()

    if (configuration?.proxyUrl) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'proxyUrl',
        configuration?.proxyUrl,
      )
    }

    if (configuration?.themeId) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'themeId',
        configuration?.themeId,
      )
    }
  }

  return {
    /** The vue app instance for the modal, be careful with this */
    app,
    /** Update the API client config */
    updateConfig(newConfig: ClientConfiguration, mergeConfigs = true) {
      if (mergeConfigs) {
        Object.assign(configuration ?? {}, newConfig)
      } else {
        objectMerge(configuration ?? {}, newConfig)
      }
      if (newConfig.spec) {
        importSpecFile(newConfig.spec)
      }
    },
    /** Update the currently selected server via URL */
    updateServer: (serverUrl: string) => {
      const server = Object.values(servers).find((s) => s.url === serverUrl)

      if (server && activeCollection.value)
        collectionMutators.edit(
          activeCollection.value?.uid,
          'selectedServerUid',
          server.uid,
        )
    },
    /** Update the currently selected server via URL */
    onUpdateServer: (callback: (url: string) => void) => {
      watch(
        () => activeCollection.value?.selectedServerUid,
        (uid) => {
          const server = Object.values(servers).find((s) => s.uid === uid)
          if (server?.url) callback(server.url)
        },
      )
    },
    /**
     * Update the auth values, we currently don't change the auth selection
     */
    updateAuth: <P extends Path<Collection['auth'][string]>>({
      nameKey,
      propertyKey,
      value,
    }: {
      nameKey: string
      propertyKey: P
      value: PathValue<Collection['auth'][string], P>
    }) => {
      const schemes = Object.values(securitySchemes)
      const scheme = schemes.find((s) => s.nameKey === nameKey)

      if (scheme && activeCollection.value)
        collectionMutators.edit(
          activeCollection.value.uid,
          `auth.${scheme.uid}.${propertyKey}`,
          // @ts-expect-error why typescript why
          value,
        )
    },
    /** Update the spec file, this will re-parse it and clear your store */
    updateSpec: async (spec: SpecConfiguration) => {
      if (spec?.url) {
        await importSpecFromUrl(spec.url, { proxy: configuration?.proxyUrl })
      } else if (spec?.content) {
        await importSpecFile(spec?.content)
      } else {
        console.error(
          `[@scalar/api-client-modal] Could not create the API client.`,
          `Please provide an OpenAPI document: { spec: { url: '…' } }`,
          `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client`,
        )
      }
    },
    /** Route to a method + path */
    route: (
      /** The first request you would like to display */
      params: OpenClientPayload,
    ) => {
      // Initial route
      const request = Object.values(requests).find(
        ({ path, method }) =>
          path === params.path &&
          method.toUpperCase() === params.method.toUpperCase(),
      )
      if (request) router.push(`/workspace/default/request/${request.uid}`)
    },

    /** Open the API client modal and optionally route to a request */
    open: (payload?: OpenClientPayload) => {
      // Find the request from path + method
      if (payload) {
        const _request = Object.values(requests).find(({ path, method }) =>
          payload
            ? // The given operation
              path === payload.path &&
              method.toUpperCase() === payload.method.toUpperCase()
            : // Or the first request
              true,
        )
        if (_request) router.push(`/workspace/default/request/${_request.uid}`)
      }

      modalState.open = true
    },
    /** Mount the references to a given element */
    mount,
    /** State for controlling the modal */
    modalState,
    /* The workspace store */
    store,
  }
}
