import { isClient } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarSelectedSecurity } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-selected-security'

import { authStorage, clientStorage } from '@/helpers/storage'

const SECRET_KEY_PREFIX = 'x-scalar-secret-' as const

type SelectedSecurityScheme = NonNullable<
  XScalarSelectedSecurity['x-scalar-selected-security']
>['selectedSchemes'][number]

/**
 * Loads the default HTTP client from storage and applies it to the workspace.
 * Only updates if no default client is already set.
 */
export const loadClientFromStorage = (store: WorkspaceStore): void => {
  const storedClient = clientStorage().get()

  if (isClient(storedClient) && !store.workspace['x-scalar-default-client']) {
    store.update('x-scalar-default-client', storedClient)
  }
}

/**
 * Checks if a key is a Scalar secret key.
 * Secret keys start with 'x-scalar-secret-' prefix.
 */
export const isSecretKey = (key: string): boolean => key.startsWith(SECRET_KEY_PREFIX)

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
  const slug = store.workspace['x-scalar-active-document']

  if (!slug) {
    console.warn('No active document found, skipping auth secrets loading')
    return
  }

  const activeDocument = store.workspace.activeDocument

  if (!activeDocument) {
    console.warn('Active document not found in workspace, skipping auth secrets loading')
    return
  }

  const securitySchemes = activeDocument.components?.securitySchemes ?? {}
  const storedAuthSchemes = authStorage().getSchemas(slug)

  for (const [key, storedScheme] of Object.entries(storedAuthSchemes)) {
    const currentScheme = getResolvedRef(securitySchemes[key])
    if (isObject(currentScheme)) {
      mergeSecrets(currentScheme, storedScheme)
    }
  }
}

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
 * Loads authentication schemes and selected security settings from local storage.
 *
 * This function restores both the available security schemes and the user's
 * selected security configuration for the active document. It validates that
 * the stored schemes still exist in the current document before restoring them.
 */
export const loadAuthSchemesFromStorage = (store: WorkspaceStore): void => {
  const slug = store.workspace['x-scalar-active-document']

  if (!slug) {
    console.warn('No active document found, skipping auth schemes loading')
    return
  }

  const activeDocument = store.workspace.activeDocument

  if (!activeDocument) {
    console.warn('Active document not found in workspace, skipping auth schemes loading')
    return
  }

  // Skip if already configured
  if (activeDocument['x-scalar-selected-security']) {
    restoreAuthSecretsFromStorage(store)
    return
  }

  const authPersistence = authStorage()
  const storedAuthSchemes = authPersistence.getSchemas(slug)
  const storedSelectedAuthSchemes = authPersistence.getSelectedSchemes(slug)
  if (!storedAuthSchemes || !storedSelectedAuthSchemes?.['x-scalar-selected-security']) {
    return
  }

  const availableSchemes = new Set(Object.keys(store.workspace.documents[slug]?.components?.securitySchemes ?? {}))
  const selectedSchemes = storedSelectedAuthSchemes['x-scalar-selected-security'].selectedSchemes ?? []
  const validSchemes = selectedSchemes.filter((scheme) => isSchemeValid(scheme, availableSchemes))

  // Only restore if we have valid schemes to prevent breaking default fallback logic
  if (validSchemes.length > 0) {
    const selectedIndex = storedSelectedAuthSchemes['x-scalar-selected-security'].selectedIndex
    const clampedIndex = clampSelectedIndex(selectedIndex, validSchemes.length)

    activeDocument['x-scalar-selected-security'] = {
      selectedIndex: clampedIndex,
      selectedSchemes: validSchemes,
    }
  }

  restoreAuthSecretsFromStorage(store)
}
