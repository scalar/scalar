import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import { coerceValue } from '@scalar/workspace-store/schemas/coerce-value'
import {
  type XScalarSelectedSecurity,
  XScalarSelectedSecuritySchema,
} from '@scalar/workspace-store/schemas/extensions/security/x-scalar-selected-security'
import {
  type SecuritySchemes,
  SecuritySchemesSchema,
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
  return {
    /**
     * Retrieves and coerces the authentication schemes stored in local storage.
     */
    getSchemas: () => {
      const parsed = JSON.parse(storage.getItem(schemasKey) ?? '{}')
      return coerceValue(SecuritySchemesSchema, parsed)
    },
    /**
     * Stores the authentication schemes in local storage.
     * @param value The SecuritySchemes object to stringify and store.
     */
    setSchemas: (prefix: string, value: SecuritySchemes) => {
      storage.setItem(`${prefix}-schemasKey`, JSON.stringify(value))
    },
    /**
     * Retrieves and coerces the selected authentication schemes stored in local storage.
     */
    getSelectedSchemes: () => {
      const parsed = JSON.parse(storage.getItem(selectedSchemesKey) ?? '{}')
      return coerceValue(XScalarSelectedSecuritySchema, parsed)
    },
    /**
     * Stores the user's selected authentication schemes in local storage.
     * @param value The XScalarSelectedSecurity object to stringify and store.
     */
    setSelectedSchemes: (prefix: string, value: XScalarSelectedSecurity) => {
      storage.setItem(`${prefix}-selectedSchemesKey`, JSON.stringify(value))
    },
  }
}
