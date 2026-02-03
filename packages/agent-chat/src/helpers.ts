import { mergeSecurity } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import { getSelectedServer } from '@scalar/api-client/v2/features/operation'
import { getServers } from '@scalar/api-client/v2/helpers'
import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import { type Auth, AuthSchema } from '@scalar/workspace-store/entities/auth'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

export function getOperations(doc: Partial<OpenAPIV3_1.Document>) {
  return Object.values(doc.paths ?? {}).flatMap((path) => Object.values(path ?? {})) as OperationObject[]
}

/** Flattens all security requirements from a document */
function getSecurityFromDocument(documentName: string, document: WorkspaceDocument, authStore: AuthStore) {
  return Object.values(mergeSecurity(document?.components?.securitySchemes, {}, authStore, documentName))
}

/** Generate document settings from workspace store */
export function createDocumentSettings(workspaceStore: WorkspaceStore) {
  return Object.fromEntries(
    Object.entries(workspaceStore.workspace.documents).map(([key, document]) => {
      const servers = getServers(document.servers, {
        documentUrl: document?.['x-scalar-original-source-url'],
      })

      return [
        key,
        {
          activeServer: getSelectedServer(document, servers),
          securitySchemes: getSecurityFromDocument(key, document, workspaceStore.auth),
        },
      ]
    }),
  )
}

// Local storage helper instance, safely wrapped.
const storage = safeLocalStorage()

/**
 * Provides an interface to store and retrieve authentication scheme
 * information in local storage, including both the available schemes and
 * the user's selected schemes.
 */
export const authStorage = () => {
  const getKey = (slug: string) => {
    return `${REFERENCE_LS_KEYS.AUTH}-${slug}`
  }

  return {
    /**
     * Retrieves and coerces the authentication schemes stored in local storage.
     */
    getAuth: (slug: string) => {
      const parsed = JSON.parse(storage.getItem(getKey(slug)) ?? '{}')
      return coerceValue(AuthSchema, parsed)
    },
    /**
     * Stores the authentication schemes in local storage.
     * @param value The Auth object to stringify and store.
     */
    setAuth: (slug: string, value: Auth) => {
      storage.setItem(getKey(slug), JSON.stringify(value))
    },
  }
}

/**
 * Restores authentication secrets from local storage to the workspace store.
 *
 * This function iterates through stored authentication schemes and restores
 * any secret values (keys starting with x-scalar-secret-) to the active
 * document's security schemes. It uses the current security schemes as the
 * source of truth, only restoring secrets for structures that exist in the
 * current document.
 */
export const restoreAuthSecretsFromStorage = ({
  documentName,
  workspaceStore,
}: {
  documentName: string
  workspaceStore: WorkspaceStore
}): void => {
  const authPersistence = authStorage()
  const auth = authPersistence.getAuth(documentName)
  workspaceStore.auth.load({ [documentName]: auth })
}

export function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return
  }
}

/**
 * Wrap url with Scalar Proxy
 *
 * Skips wrapping if the url is localhost
 */
export function makeScalarProxyUrl(url: string) {
  try {
    if (url.startsWith('/') || url.startsWith('http://localhost')) {
      return url
    }

    const params = new URLSearchParams({ scalar_url: url })

    const proxyUrl = new URL(`https://proxy.scalar.com/?${params}`)

    /**
     * For now we use our proxy only by default. We do not
     * want this to come from the config or be set by the user
     */
    return proxyUrl.toString()
  } catch {
    console.error(`Invalid URL provided: ${url}`)
    return url
  }
}
