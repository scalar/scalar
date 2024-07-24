import { createWorkspaceStore } from '@/store/workspace'
import type { AuthenticationState, SpecConfiguration } from '@scalar/oas-utils'
import { createWorkspace } from '@scalar/oas-utils/entities/workspace'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import type { SecurityScheme } from '@scalar/oas-utils/entities/workspace/security'
import { type RequestMethod, objectMerge } from '@scalar/oas-utils/helpers'
import { getNestedValue } from '@scalar/object-utils/nested'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import type { ThemeId } from '@scalar/themes'
import type { Paths } from 'type-fest'
import { type Component, createApp } from 'vue'
import type { Router } from 'vue-router'

/** Configuration options for the Scalar API client */
export type ClientConfiguration = {
  /** The Swagger/OpenAPI spec to render */
  spec?: SpecConfiguration
  /** Pass in a proxy to the API client */
  proxyUrl?: string
  /** Pass in a theme API client */
  themeId?: ThemeId
  /** Whether to show the sidebar */
  showSidebar?: boolean
  /** Whether dark mode is on or off initially (light mode) */
  // darkMode?: boolean
  /** Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey?:
    | 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'g'
    | 'h'
    | 'i'
    | 'j'
    | 'k'
    | 'l'
    | 'm'
    | 'n'
    | 'o'
    | 'p'
    | 'q'
    | 'r'
    | 's'
    | 't'
    | 'u'
    | 'v'
    | 'w'
    | 'x'
    | 'y'
    | 'z'
}

export type OpenClientPayload = {
  path: string
  method: RequestMethod | Lowercase<RequestMethod> | string
}

type CreateApiClientParams = {
  /** Element to mount the references to */
  el: HTMLElement | null
  /** Main vue app component to create the vue app */
  appComponent: Component
  /** Configuration object for Scalar References */
  configuration: Omit<ClientConfiguration, 'spec'>
  /** Read only version of the client app */
  isReadOnly?: boolean
  persistData?: boolean
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize?: boolean
  /** Instance of a vue router */
  router: Router
}

/**
 * Sync method to create the api client vue app and store
 *
 * This method will NOT import the spec, just create the modal so you must use update/updateConfig before opening
 */
export const createApiClient = ({
  el,
  appComponent,
  configuration,
  isReadOnly = false,
  persistData = true,
  mountOnInitialize = true,
  router,
}: CreateApiClientParams) => {
  const store = createWorkspaceStore(router, persistData)

  // Strictly make the default workspace with no side effects, to be overwritten by importing a spec
  store.workspaceMutators.rawAdd(
    createWorkspace({
      uid: 'default',
      name: 'Workspace',
      isReadOnly,
      proxyUrl: configuration.proxyUrl ?? 'https://proxy.scalar.com',
    }),
  )

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
    securitySchemeMutators,
    securitySchemes,
    serverMutators,
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

    if (configuration.proxyUrl) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'proxyUrl',
        configuration.proxyUrl,
      )
    }

    if (configuration.themeId) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'themeId',
        configuration.themeId,
      )
    }
  }

  return {
    /** The vue app instance for the modal, be careful with this */
    app,
    /** Update the API client config */
    updateConfig(newConfig: ClientConfiguration, mergeConfigs = true) {
      if (mergeConfigs) {
        Object.assign(configuration, newConfig)
      } else {
        objectMerge(configuration, newConfig)
      }
      if (newConfig.spec) {
        importSpecFile(newConfig.spec)
      }
    },
    /**
     * TODO this is just temporary for the modal, we'll put in a proper solution later
     * Here we update the currently selected serverUrl
     */
    updateServerUrl: (serverUrl: string) =>
      serverMutators.edit(
        activeCollection.value?.selectedServerUid ?? '',
        'url',
        serverUrl,
      ),
    /**
     * Update the security schemes
     * maps the references useAuthenticationStore to the client auth
     */
    updateAuth: (auth: AuthenticationState) => {
      const schemes = Object.values(securitySchemes)

      // Loop on all schemes from client to see which types we have
      schemes.forEach((scheme) => {
        /**
         * Edit helper to reduce some boilerplate in the switch statements
         * Ensures the passed in value exists and one does not exist already
         */
        const edit = (
          value: string | string[],
          path: Paths<SecurityScheme> = 'value',
        ) =>
          value.length &&
          !getNestedValue(scheme, path).length &&
          securitySchemeMutators.edit(scheme.uid, path, value)

        switch (scheme.type) {
          case 'apiKey':
            edit(auth.apiKey.token)
            break

          case 'http':
            if (scheme.scheme === 'bearer') edit(auth.http.bearer.token)
            else if (scheme.scheme === 'basic') {
              edit(auth.http.basic.username)
              edit(auth.http.basic.password, 'secondValue')
            }
            break

          // Currently we only support implicit + password on the references side
          case 'oauth2':
            edit(auth.oAuth2.clientId, 'clientId')

            // Implicit
            if (scheme.flows.implicit) {
              edit(auth.oAuth2.accessToken, 'flows.implicit.token')
              edit(auth.oAuth2.scopes, 'flows.implicit.selectedScopes')
            }

            // Password
            else if (scheme.flows.password) {
              edit(auth.oAuth2.accessToken, 'flows.password.token')
              edit(auth.oAuth2.scopes, 'flows.password.selectedScopes')
              edit(auth.oAuth2.username, 'flows.password.value')
              edit(auth.oAuth2.password, 'flows.password.secondValue')
            }
            break
        }
      })

      // Select the correct scheme
      if (auth.preferredSecurityScheme) {
        const payload: Collection['selectedSecuritySchemes'][0] = {
          uid: auth.preferredSecurityScheme!,
        }
        const preferredScheme = auth.securitySchemes?.[
          auth.preferredSecurityScheme ?? ''
        ] as OpenAPIV3_1.SecuritySchemeObject

        if (preferredScheme?.type === 'oauth2') {
          payload.flowKey = preferredScheme.flows?.implicit
            ? 'implicit'
            : 'password'
        }

        collectionMutators.edit(
          activeCollection.value!.uid,
          'selectedSecuritySchemes',
          [payload],
        )
      }
    },
    /** Update the spec file, this will re-parse it and clear your store */
    updateSpec: (spec: SpecConfiguration) => {
      if (spec?.url) {
        importSpecFromUrl(spec.url, configuration.proxyUrl)
      } else if (spec?.content) {
        importSpecFile(spec?.content)
      } else {
        console.error(
          `[@scalar/api-client-modal] Could not create the API client.`,
          `Please provide an OpenAPI document: { spec: { url: '…' } }`,
          `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client`,
        )
      }
    },
    /** Open the  API client modal */
    open: (payload?: OpenClientPayload) => {
      // Find the request from path + method
      const request = Object.values(requests).find(({ path, method }) =>
        payload
          ? // The given operation
            path === payload.path &&
            method.toUpperCase() === payload.method.toUpperCase()
          : // Or the first request
            true,
      )
      if (request) router.push(`/workspace/default/request/${request.uid}`)

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
