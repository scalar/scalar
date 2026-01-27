import { reactive } from 'vue'

import { type DocumentAuth, DocumentAuthSchema, type SecretsAuth } from '@/entities/auth/schema'
import { createDetectChangesProxy } from '@/helpers/detect-changes-proxy'
import { safeAssign } from '@/helpers/general'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { coerceValue } from '@/schemas/typebox-coerce'

/**
 * Interface for the AuthStore used to manage authentication secrets and selection state.
 */
export type AuthStore = {
  /**
   * Retrieves the authentication secrets for a given document and security scheme.
   * @param documentName - Name/id of the OpenAPI document.
   * @param schemeName - Name of the security scheme.
   * @returns The authentication secrets, or undefined if not found.
   */
  getAuthSecrets: (documentName: string, schemeName: string) => SecretsAuth[string] | undefined

  /**
   * Sets the authentication secrets for a given document and security scheme.
   * @param documentName - Name/id of the OpenAPI document.
   * @param schemeName - Name of the security scheme.
   * @param auth - The secret/auth object to set.
   */
  setAuthSecrets: (documentName: string, schemeName: string, auth: SecretsAuth[string]) => void

  /**
   * Removes the authentication data for a given document.
   * @param documentName - Name/id of the OpenAPI document.
   */
  clearDocumentAuth: (documentName: string) => void

  /**
   * Loads authentication data into the store, replacing existing state.
   * @param data - A DocumentAuth object.
   */
  load: (data: DocumentAuth) => void

  /**
   * Exports the current authentication state as a plain (non-proxy) DocumentAuth object.
   * @returns The authentication state.
   */
  export: () => DocumentAuth
}

export type CreateAuthStoreOptions = {
  hooks?: {
    onAuthChange?: (documentName: string) => void
  }
}

/**
 * Factory function to create a new AuthStore instance.
 */
export const createAuthStore = ({ hooks }: CreateAuthStoreOptions = {}): AuthStore => {
  // Vue reactive object to hold all authentication state
  const auth = reactive<DocumentAuth>(
    createDetectChangesProxy(
      {},
      {
        hooks: {
          onAfterChange: (path) => {
            if (path.length < 1) {
              return
            }
            const [documentName] = path
            if (typeof documentName !== 'string') {
              return
            }
            hooks?.onAuthChange?.(documentName)
          },
        },
      },
    ),
  )

  const getAuthSecrets: AuthStore['getAuthSecrets'] = (documentName, schemeName) => {
    return auth[documentName]?.secrets?.[schemeName]
  }

  const setAuthSecrets: AuthStore['setAuthSecrets'] = (documentName, schemeName, data) => {
    auth[documentName] ||= { secrets: {}, selected: { document: { selectedIndex: 0, selectedSchemes: [] }, path: {} } }
    auth[documentName].secrets[schemeName] = data
  }

  const clearDocumentAuth: AuthStore['clearDocumentAuth'] = (documentName) => {
    delete auth[documentName]
  }

  const load: AuthStore['load'] = (data) => {
    safeAssign(auth, coerceValue(DocumentAuthSchema, data))
  }

  const exportAuth: AuthStore['export'] = () => {
    return unpackProxyObject(auth)
  }

  return {
    getAuthSecrets,
    setAuthSecrets,
    clearDocumentAuth,
    load,
    export: exportAuth,
  }
}
