import { ApiClientModal } from '@/components'
import type { ClientConfiguration, OpenClientPayload } from '@/types'
import { clientRouter, useWorkspace } from '@scalar/client-app'
import type { AuthenticationState, SpecConfiguration } from '@scalar/oas-utils'
import type { SecurityScheme } from '@scalar/oas-utils/entities/workspace/security'
import { objectMerge } from '@scalar/oas-utils/helpers'
import { getNestedValue } from '@scalar/object-utils/nested'
import type { Paths } from 'type-fest'
import { createApp, reactive } from 'vue'

/** Initialize Scalar API Client Modal */
export const createScalarApiClient = async (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for Scalar References */
  initialConfig: ClientConfiguration,
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) => {
  const config = reactive(initialConfig)

  const {
    importSpecFile,
    importSpecFromUrl,
    modalState,
    requests,
    securitySchemeMutators,
    securitySchemes,
    workspaceMutators,
  } = useWorkspace()

  // Import the spec if needed
  if (config.spec?.url) {
    importSpecFromUrl(config.spec.url, config.proxyUrl)
  } else if (config.spec?.content) {
    importSpecFile(config.spec?.content)
  } else {
    console.error(
      `[@scalar/api-client-modal] Could not create the API client.`,
      `Please provide an OpenAPI document: { spec: { url: '…' } }`,
      `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal`,
    )
  }

  const app = createApp(ApiClientModal, { config, modalState })
  app.use(clientRouter)

  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.error(
        `[@scalar/api-client-modal] Could not create the API client.`,
        `Invalid HTML element provided.`,
        `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal`,
      )

      return
    }
    app.mount(mountingEl)
  }

  if (mountOnInitialize) mount()
  workspaceMutators.edit('isReadOnly', true)

  return {
    /** Update the API client config */
    updateConfig(newConfig: ClientConfiguration, mergeConfigs = true) {
      if (mergeConfigs) {
        Object.assign(config, newConfig)
      } else {
        objectMerge(config, newConfig)
      }
      if (newConfig.spec) importSpecFile(newConfig.spec)
    },
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
    },
    /** Update the spec file, this will re-parse it and clear your store */
    updateSpec: (spec: SpecConfiguration) => importSpecFile(spec),
    /** Open the  API client modal */
    open: (payload?: OpenClientPayload) => {
      // Find the request from path + method
      const request = Object.values(requests).find(({ path, method }) =>
        payload
          ? // The given operation
            path === payload.path && method === payload.method
          : // Or the first request
            true,
      )
      if (request) clientRouter.push(`/request/${request.uid}`)

      modalState.open = true
    },
    /** Mount the references to a given element */
    mount,
    modalState,
  }
}
