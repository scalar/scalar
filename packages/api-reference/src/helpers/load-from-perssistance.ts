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
 * Checks if a key represents a Scalar secret.
 * Secret keys are prefixed with 'x-scalar-secret-'.
 */
export const isSecretKey = (key: string): boolean => key.startsWith(SECRET_KEY_PREFIX)

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Recursively merges secret values from stored data into the current schema.
 *
 * This walks through both objects in parallel, restoring any keys prefixed with
 * 'x-scalar-secret-' from the stored object to the current object. Secrets are
 * only restored if the corresponding structure exists in the current schema and
 * the current value is empty.
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
 * Retrieves the active document from the workspace store.
 * Returns null if no active document is found.
 */
const getActiveDocument = (store: WorkspaceStore) => {
  const slug = store.workspace['x-scalar-active-document']

  if (!slug) {
    return null
  }

  return store.workspace.documents[slug] ?? null
}

/**
 * Restores authentication secrets from local storage to the workspace store.
 *
 * This iterates through stored authentication schemes and restores any secret
 * values (keys starting with x-scalar-secret-) to the active document's security
 * schemes. The current security schemes are used as the source of truth, so
 * secrets are only restored for structures that exist in the current document.
 */
const restoreAuthSecretsFromStorage = (store: WorkspaceStore): void => {
  const slug = store.workspace['x-scalar-active-document']

  if (!slug) {
    console.warn('No active document found, skipping auth secrets loading')
    return
  }

  const activeDocument = getActiveDocument(store)

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
 * This restores both the available security schemes and the user's selected
 * security configuration for the active document. It validates that the stored
 * schemes still exist in the current document before restoring them.
 *
 * If no valid schemes are found, this function does not set x-scalar-selected-security,
 * allowing the default fallback logic to work correctly.
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
