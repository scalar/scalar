import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import type { XScalarSelectedSecurity } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-selected-security'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type SecuritySchemes,
  SecuritySchemesSchema,
  XScalarSelectedSecuritySchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

// Local storage helper instance, safely wrapped.
const storage = safeLocalStorage()

/**
 * Provides an interface to store and retrieve the selected client value
 * in local storage.
 */
export const clientStorage = () => {
  const key = REFERENCE_LS_KEYS.SELECTED_CLIENT
  return {
    /**
     * Gets the stored selected client from local storage.
     */
    get: () => {
      return storage.getItem(key)
    },
    /**
     * Stores the selected client value in local storage.
     * @param value The value to store
     */
    set: (value: string) => {
      storage.setItem(key, value as string)
    },
  }
}

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
