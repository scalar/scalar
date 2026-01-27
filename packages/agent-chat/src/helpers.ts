import { getSelectedServer } from '@scalar/api-client/v2/features/operation'
import { getServers } from '@scalar/api-client/v2/helpers'
import { isObject } from '@scalar/helpers/object/is-object'
import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { XScalarSelectedSecurity } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-selected-security'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type {
  OperationObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  type SecuritySchemes,
  SecuritySchemesSchema,
  XScalarSelectedSecuritySchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

export function getOperations(doc: Partial<OpenAPIV3_1.Document>) {
  return Object.values(doc.paths ?? {}).flatMap((path) => Object.values(path ?? {})) as OperationObject[]
}

/** Flattens all security requirements from a document */
function getSecurityFromDocument(document: WorkspaceDocument) {
  const selectedSchemes = document['x-scalar-selected-security']?.selectedSchemes ?? []

  const schemeKeys = selectedSchemes.flatMap((scheme) => Object.keys(scheme))

  const securitySchemes = document.components?.securitySchemes

  if (!securitySchemes) {
    return []
  }

  return schemeKeys.reduce<SecuritySchemeObject[]>((acc, cur) => {
    const security = securitySchemes[cur]

    if (security) {
      acc.push(getResolvedRef(security))
    }

    return acc
  }, [])
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
          securitySchemes: getSecurityFromDocument(document),
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
  const schemasKey = REFERENCE_LS_KEYS.AUTH_SCHEMES
  const selectedSchemesKey = REFERENCE_LS_KEYS.SELECTED_AUTH_SCHEMES

  const getAuthId = (type: 'schemas' | 'selectedSchemes', prefix: string) => {
    const getKey = (type: 'schemas' | 'selectedSchemes') => {
      return type === 'schemas' ? schemasKey : selectedSchemesKey
    }
    return `${prefix}-${getKey(type)}`
  }

  return {
    /**
     * Retrieves and coerces the authentication schemes stored in local storage.
     */
    getSchemas: (slug: string) => {
      const parsed = JSON.parse(storage.getItem(getAuthId('schemas', slug)) ?? '{}')
      return coerceValue(SecuritySchemesSchema, parsed)
    },
    /**
     * Stores the authentication schemes in local storage.
     * @param value The SecuritySchemes object to stringify and store.
     */
    setSchemas: (slug: string, value: SecuritySchemes) => {
      storage.setItem(getAuthId('schemas', slug), JSON.stringify(value))
    },
    /**
     * Retrieves and coerces the selected authentication schemes stored in local storage.
     */
    getSelectedSchemes: (slug: string) => {
      const parsed = JSON.parse(storage.getItem(getAuthId('selectedSchemes', slug)) ?? '{}')
      return coerceValue(XScalarSelectedSecuritySchema, parsed)
    },
    /**
     * Stores the user's selected authentication schemes in local storage.
     * @param value The XScalarSelectedSecurity object to stringify and store.
     */
    setSelectedSchemes: (slug: string, value: XScalarSelectedSecurity) => {
      storage.setItem(getAuthId('selectedSchemes', slug), JSON.stringify(value))
    },
  }
}

/**
 * Recursively merges secret values from stored data into the current schema.
 * Only merges secrets if the corresponding structure exists in the current schema.
 *
 * This function walks through both objects in parallel, copying any keys that
 * start with 'x-scalar-secret-' from the stored object to the current object,
 * but only if the path exists in the current schema.
 *
 * @param current - The current schema object (source of truth for structure)
 * @param stored - The stored object containing secret values to restore
 */
const mergeSecrets = (current: unknown, stored: unknown): void => {
  if (!isObject(current) || !isObject(stored)) {
    return
  }

  // Iterate through stored keys to find secrets to restore
  for (const [key, storedValue] of Object.entries(stored)) {
    // If this is a secret key and it has a value, restore it to current
    if (typeof storedValue !== 'object') {
      current[key] = storedValue
      continue
    }

    // If the value is an object (and not null), recurse into it
    mergeSecrets(getResolvedRef(current[key]), storedValue)
  }
}

type SelectedSecurityScheme = NonNullable<
  XScalarSelectedSecurity['x-scalar-selected-security']
>['selectedSchemes'][number]

/**
 * Validates that all keys in a security scheme exist in the available schemes.
 */
const isSchemeValid = (scheme: SelectedSecurityScheme, availableSchemes: Set<string>): boolean =>
  Object.keys(scheme).every((key) => availableSchemes.has(key))

/**
 * Clamps the selected index to be within the valid range of schemes.
 * If the index is out of bounds, returns the last valid index.
 */
const clampSelectedIndex = (selectedIndex: number, schemesLength: number): number =>
  selectedIndex >= schemesLength ? schemesLength - 1 : selectedIndex

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
  const storedAuthSchemes = authStorage().getSchemas(documentName)

  const document = workspaceStore.workspace.documents[documentName]

  if (!document) {
    return
  }

  const authPersistence = authStorage()

  const storedSelectedAuthSchemes = authPersistence.getSelectedSchemes(documentName)

  const availableSchemes = new Set(Object.keys(document.components?.securitySchemes ?? {}))

  const selectedSchemes = storedSelectedAuthSchemes['x-scalar-selected-security']?.selectedSchemes

  const validSchemes = selectedSchemes?.filter((scheme) => isSchemeValid(scheme, availableSchemes))

  if (!document['x-scalar-selected-security'] && validSchemes && validSchemes.length > 0) {
    const selectedIdx = storedSelectedAuthSchemes['x-scalar-selected-security']?.selectedIndex

    const clampedIndex = clampSelectedIndex(selectedIdx ?? 0, validSchemes.length)

    document['x-scalar-selected-security'] = {
      selectedIndex: clampedIndex,
      selectedSchemes: validSchemes,
    }
  }

  const securitySchemes = document.components?.securitySchemes ?? {}

  for (const [key, storedScheme] of Object.entries(storedAuthSchemes)) {
    const currentScheme = getResolvedRef(securitySchemes[key])

    if (isObject(currentScheme)) {
      mergeSecrets(currentScheme, storedScheme)
    }
  }
}

export function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return
  }
}
