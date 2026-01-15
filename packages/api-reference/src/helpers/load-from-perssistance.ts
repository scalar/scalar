import { isClient } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { XScalarSelectedSecurity } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-selected-security'

import { authStorage, clientStorage } from '@/helpers/storage'

export const loadClientFromStorage = (store: WorkspaceStore) => {
  const storedClient = clientStorage().get()
  if (isClient(storedClient) && !store.workspace['x-scalar-default-client']) {
    store.update('x-scalar-default-client', storedClient)
  }
}

/**
 * Restores authentication secrets from local storage to the workspace store.
 *
 * This function iterates through stored authentication schemes and restores
 * the secret values (tokens, passwords, client secrets, etc.) to the active
 * document's security schemes if they exist in the current document.
 */
const restoreAuthSecretsFromStorage = (store: WorkspaceStore) => {
  const slug = store.workspace['x-scalar-active-document'] ?? ''
  if (!slug) {
    console.warn('No active document found, skipping auth secrets loading')
    return
  }

  const activeDocument = store.workspace.documents[slug]
  if (!activeDocument) {
    console.warn('No active document found, skipping auth secrets loading')
    return
  }

  const { securitySchemes = {} } = activeDocument.components ?? {}

  const authPersistence = authStorage()
  const storedAuthSchemes = authPersistence.getSchemas(slug)

  Object.entries(storedAuthSchemes).forEach(([key, storedScheme]) => {
    const currentScheme = securitySchemes[key]

    // If the scheme is in the document, we can restore the secrets
    if (key in securitySchemes && currentScheme && typeof currentScheme === 'object' && !('$ref' in currentScheme)) {
      // Treat currentScheme as an object we can safely add properties to
      const scheme = currentScheme as Record<string, any>

      // Restore token secrets (used in apiKey, http, and OAuth flows)
      if ('x-scalar-secret-token' in storedScheme && storedScheme['x-scalar-secret-token']) {
        scheme['x-scalar-secret-token'] = storedScheme['x-scalar-secret-token']
      }

      // Restore HTTP authentication secrets (username and password)
      if ('x-scalar-secret-username' in storedScheme && storedScheme['x-scalar-secret-username']) {
        scheme['x-scalar-secret-username'] = storedScheme['x-scalar-secret-username']
      }
      if ('x-scalar-secret-password' in storedScheme && storedScheme['x-scalar-secret-password']) {
        scheme['x-scalar-secret-password'] = storedScheme['x-scalar-secret-password']
      }

      // Restore OAuth2 secrets from flows
      if ('type' in scheme && scheme.type === 'oauth2' && 'flows' in scheme && scheme.flows) {
        const storedFlows =
          'type' in storedScheme && storedScheme.type === 'oauth2' && 'flows' in storedScheme
            ? storedScheme.flows
            : null

        if (storedFlows) {
          // Iterate through each flow type (implicit, password, clientCredentials, authorizationCode)
          const flowTypes = ['implicit', 'password', 'clientCredentials', 'authorizationCode'] as const

          flowTypes.forEach((flowType) => {
            const currentFlow = scheme.flows[flowType]
            const storedFlow = storedFlows[flowType]

            if (currentFlow && storedFlow && typeof currentFlow === 'object' && typeof storedFlow === 'object') {
              // Restore client ID
              if ('x-scalar-secret-client-id' in storedFlow && storedFlow['x-scalar-secret-client-id']) {
                currentFlow['x-scalar-secret-client-id'] = storedFlow['x-scalar-secret-client-id']
              }

              // Restore client secret
              if ('x-scalar-secret-client-secret' in storedFlow && storedFlow['x-scalar-secret-client-secret']) {
                currentFlow['x-scalar-secret-client-secret'] = storedFlow['x-scalar-secret-client-secret']
              }

              // Restore redirect URI
              if ('x-scalar-secret-redirect-uri' in storedFlow && storedFlow['x-scalar-secret-redirect-uri']) {
                currentFlow['x-scalar-secret-redirect-uri'] = storedFlow['x-scalar-secret-redirect-uri']
              }

              // Restore token (used in OAuth flows)
              if ('x-scalar-secret-token' in storedFlow && storedFlow['x-scalar-secret-token']) {
                currentFlow['x-scalar-secret-token'] = storedFlow['x-scalar-secret-token']
              }

              // Restore username and password (used in password flow)
              if ('x-scalar-secret-username' in storedFlow && storedFlow['x-scalar-secret-username']) {
                currentFlow['x-scalar-secret-username'] = storedFlow['x-scalar-secret-username']
              }
              if ('x-scalar-secret-password' in storedFlow && storedFlow['x-scalar-secret-password']) {
                currentFlow['x-scalar-secret-password'] = storedFlow['x-scalar-secret-password']
              }
            }
          })
        }
      }
    }
  })
}

/**
 * Loads authentication schemes and selected security settings from local storage.
 *
 * This function restores both the available security schemes and the user's
 * selected security configuration for the active document. It validates that
 * the stored schemes still exist in the current document before restoring them.
 */
export const loadAuthSchemesFromStorage = (store: WorkspaceStore) => {
  console.log('loadAuthSchemesFromStorage', store.workspace)
  const slug = store.workspace['x-scalar-active-document'] ?? ''
  if (!slug) {
    console.warn('No active document found, skipping auth schemes loading')
    return
  }

  const authPersistence = authStorage()
  const storedAuthSchemes = authPersistence.getSchemas(slug)
  const storedSelectedAuthSchemes = authPersistence.getSelectedSchemes(slug)

  const availableAuthSchemes = new Set(Object.keys(store.workspace.documents[slug]?.components?.securitySchemes ?? {}))

  const isSchemeValid = (
    scheme: NonNullable<XScalarSelectedSecurity['x-scalar-selected-security']>['selectedSchemes'][number],
  ) => {
    return Object.keys(scheme).every((key) => availableAuthSchemes.has(key))
  }

  const activeDocument = store.workspace.activeDocument

  if (!activeDocument) {
    console.warn('No active document found, skipping auth schemes loading')
    return
  }

  if (storedAuthSchemes && storedSelectedAuthSchemes?.['x-scalar-selected-security']) {
    if (!activeDocument['x-scalar-selected-security']) {
      activeDocument['x-scalar-selected-security'] = {
        selectedIndex: storedSelectedAuthSchemes['x-scalar-selected-security'].selectedIndex,
        selectedSchemes: storedSelectedAuthSchemes['x-scalar-selected-security'].selectedSchemes?.filter(isSchemeValid),
      }
    }

    // Restore the auth secrets from storage
    restoreAuthSecretsFromStorage(store)
  }
}
