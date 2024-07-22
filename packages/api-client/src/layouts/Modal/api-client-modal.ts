import { modalRouter } from '@/router'
import { useWorkspace } from '@/store/workspace'
import type { AuthenticationState, SpecConfiguration } from '@scalar/oas-utils'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import type { SecurityScheme } from '@scalar/oas-utils/entities/workspace/security'
import { type RequestMethod, objectMerge } from '@scalar/oas-utils/helpers'
import { getNestedValue } from '@scalar/object-utils/nested'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import type { ThemeId } from '@scalar/themes'
import type { Paths } from 'type-fest'
import { createApp } from 'vue'

import ApiClientModal from './ApiClientModal.vue'

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
  method: RequestMethod | Lowercase<RequestMethod>
}

/**
 * Initialize Scalar API Client Modal
 *
 * This async method includes importing the spec
 */
export const createApiClientModal = async (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for Scalar References */
  config: ClientConfiguration,
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) => {
  const { importSpecFile, importSpecFromUrl, workspaceMutators } =
    useWorkspace()

  // Import the spec if needed
  if (config.spec?.url) {
    await importSpecFromUrl(config.spec.url, config.proxyUrl, true)
  } else if (config.spec?.content) {
    await importSpecFile(config.spec?.content, undefined, undefined, true)
  } else {
    workspaceMutators.add({
      uid: 'default',
      name: 'Workspace',
      isReadOnly: true,
      proxyUrl: 'https://proxy.scalar.com',
    })
  }

  return createApiClientModalSync(el, config, mountOnInitialize, false)
}

/**
 * Sync method to create client modal
 *
 * This method will NOT import the spec, just create the modal so you must use update/updateConfig before opening
 */
export const createApiClientModalSync = (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for Scalar References */
  config: Omit<ClientConfiguration, 'spec'>,
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
  /** Creates a default workspace */
  createDefaultWorkspace = false,
) => {
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
  } = useWorkspace()

  // Create a default workspace
  if (createDefaultWorkspace) {
    workspaceMutators.add({
      uid: 'default',
      name: 'Workspace',
      isReadOnly: true,
      proxyUrl: config.proxyUrl ?? 'https://proxy.scalar.com',
    })
  }

  const app = createApp(ApiClientModal, { modalState })
  app.use(modalRouter)

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

    if (config.proxyUrl) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'proxyUrl',
        config.proxyUrl,
      )
    }

    if (config.themeId) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'themeId',
        config.themeId,
      )
    }
  }

  return {
    /** The vue app instance for the modal, be careful with this */
    app,
    /** Update the API client config */
    updateConfig(newConfig: ClientConfiguration, mergeConfigs = true) {
      if (mergeConfigs) {
        Object.assign(config, newConfig)
      } else {
        objectMerge(config, newConfig)
      }
      if (newConfig.spec) {
        importSpecFile(newConfig.spec, undefined, undefined, true)
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
        importSpecFromUrl(spec.url, config.proxyUrl, true)
      } else if (spec?.content) {
        importSpecFile(spec?.content, undefined, undefined, true)
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
      if (request) modalRouter.push(`/workspace/default/request/${request.uid}`)

      modalState.open = true
    },
    /** Mount the references to a given element */
    mount,
    modalState,
  }
}
