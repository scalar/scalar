import { isClient } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarSelectedSecurity } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-selected-security'

import { authStorage, clientStorage } from '@/helpers/storage'

export const loadClientFromStorage = (store: WorkspaceStore) => {
  const storedClient = clientStorage().get()
  if (isClient(storedClient) && !store.workspace['x-scalar-default-client']) {
    store.update('x-scalar-default-client', storedClient)
  }
}

/**
 * Checks if a key is a Scalar secret key.
 * Secret keys start with 'x-scalar-secret-' prefix.
 */
export const isSecretKey = (key: string): boolean => {
  return key.startsWith('x-scalar-secret-')
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
export const mergeSecrets = (current: unknown, stored: unknown): void => {
  if (!isObject(current) || !isObject(stored)) {
    return
  }

  // Iterate through stored keys to find secrets to restore
  for (const [key, storedValue] of Object.entries(stored)) {
    // If this is a secret key and it has a value, restore it to current
    if (isSecretKey(key) && storedValue && current[key] === '') {
      current[key] = storedValue
      continue
    }

    // If the value is an object (and not null), recurse into it
    mergeSecrets(getResolvedRef(current[key]), storedValue)
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
const restoreAuthSecretsFromStorage = (store: WorkspaceStore): void => {
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

  // Iterate through each stored security scheme
  Object.entries(storedAuthSchemes).forEach(([key, storedScheme]) => {
    const currentScheme = getResolvedRef(securitySchemes[key])

    mergeSecrets(currentScheme, storedScheme)
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
