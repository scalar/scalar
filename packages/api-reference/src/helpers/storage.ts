import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import { type Auth, AuthSchema } from '@scalar/workspace-store/entities/auth'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'

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
