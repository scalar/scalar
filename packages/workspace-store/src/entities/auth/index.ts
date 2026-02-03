import { preventPollution } from '@scalar/helpers/object/prevent-pollution'
import { reactive } from 'vue'

import {
  type DocumentAuth,
  DocumentAuthSchema,
  type SecretsAuthUnion,
  SecretsAuthUnionSchema,
  type SelectedSecurity,
} from '@/entities/auth/schema'
import { createDetectChangesProxy } from '@/helpers/detect-changes-proxy'
import { safeAssign } from '@/helpers/general'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { coerceValue } from '@/schemas/typebox-coerce'

export type {
  Auth,
  SecretsApiKey,
  SecretsAuth,
  SecretsAuthUnion,
  SecretsHttp,
  SecretsOAuth,
  SecretsOAuthFlows,
  SelectedSecurity,
} from './schema'
export {
  AuthSchema,
  SecretsAuthSchema,
} from './schema'

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
  getAuthSecrets: (documentName: string, schemeName: string) => SecretsAuthUnion | undefined

  /**
   * Retrieves the selected schemas for a given document or path.
   * @param payload - The payload to get the selected schemas for.
   * @returns The selected schemas, or undefined if not found.
   */
  getAuthSelectedSchemas: (
    payload:
      | { type: 'document'; documentName: string }
      | { type: 'operation'; documentName: string; path: string; method: string },
  ) => SelectedSecurity | undefined

  /**
   * Sets the selected schemas for a given document or path.
   * @param payload - The payload to set the selected schemas for.
   * @param selectedSchemes - The selected schemas to set.
   */
  setAuthSelectedSchemas: (
    payload:
      | { type: 'document'; documentName: string }
      | { type: 'operation'; documentName: string; path: string; method: string },
    selectedSchemes: SelectedSecurity,
  ) => void
  /**
   * Sets the authentication secrets for a given document and security scheme.
   * @param documentName - Name/id of the OpenAPI document.
   * @param schemeName - Name of the security scheme.
   * @param auth - The secret/auth object to set.
   */
  setAuthSecrets: (documentName: string, schemeName: string, auth: SecretsAuthUnion) => void

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

type CreateAuthStoreOptions = {
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
    auth[documentName] ||= { secrets: {}, selected: { document: undefined, path: undefined } }
    auth[documentName].secrets[schemeName] = coerceValue(SecretsAuthUnionSchema, data)
  }

  const getAuthSelectedSchemas: AuthStore['getAuthSelectedSchemas'] = (payload) => {
    if (payload.type === 'document') {
      return auth[payload.documentName]?.selected?.document
    }
    return auth[payload.documentName]?.selected?.path?.[payload.path]?.[payload.method]
  }

  const setAuthSelectedSchemas: AuthStore['setAuthSelectedSchemas'] = (payload, selectedSchemes) => {
    auth[payload.documentName] ||= {
      secrets: {},
      selected: { document: undefined, path: undefined },
    }

    // TypeScript needs a non-null assertion here since we just ensured it exists
    const documentAuth = auth[payload.documentName]!

    if (payload.type === 'document') {
      documentAuth.selected.document = selectedSchemes
    } else {
      // Prevent assigning dangerous keys to the path items object
      preventPollution(payload.path)
      preventPollution(payload.method)

      documentAuth.selected.path ||= {}
      documentAuth.selected.path[payload.path] ||= {}
      const pathAuth = documentAuth.selected.path[payload.path]!
      pathAuth[payload.method] = selectedSchemes
    }
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
    getAuthSelectedSchemas,
    setAuthSelectedSchemas,
    clearDocumentAuth,
    load,
    export: exportAuth,
  }
}
