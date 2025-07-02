import type { UnknownObject } from '@/helpers/general'
import type {
  XScalarClientConfigCookie,
  XScalarClientConfigCookies,
} from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-cookies'

/**
 * Cookie mutators for managing client configuration cookies in OpenAPI documents.
 * Provides functions to add and delete cookies from the document's x-scalar-client-config-cookies extension.
 *
 * @param store - The workspace store containing the documents
 * @param documentName - The name of the document to operate on
 * @returns Object containing addCookie and deleteCookie functions
 */
export const cookieMutators = (
  document?: UnknownObject & { 'x-scalar-client-config-cookies'?: XScalarClientConfigCookies },
) => {
  /**
   * Adds a new cookie to the document's client configuration.
   * If a cookie with the same name already exists, it will log a warning and return false.
   *
   * @param cookie - The cookie configuration to add
   * @returns true if the cookie was added successfully, false if it already exists
   *
   * @example
   * // Add a new authentication cookie
   * const success = addCookie({
   *   name: 'auth-token',
   *   value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
   *   domain: '.example.com',
   *   path: '/'
   * })
   *
   * if (success) {
   *   console.log('Cookie added successfully')
   * } else {
   *   console.log('Cookie already exists')
   * }
   */
  const addCookie = (cookie: XScalarClientConfigCookie) => {
    if (!document) {
      return false
    }

    if (!document['x-scalar-client-config-cookies']) {
      document['x-scalar-client-config-cookies'] = {}
    }

    if (document['x-scalar-client-config-cookies'][cookie.name]) {
      console.warn(`Cookie with name "${cookie.name}" already exists in the document.`)
      return false
    }

    document['x-scalar-client-config-cookies'][cookie.name] = cookie
    return true
  }

  /**
   * Removes a cookie from the document's x-scalar-client-config-cookies extension by its name.
   * Returns false if the document or cookies object does not exist, otherwise deletes the cookie and returns true.
   *
   * @param cookieName - The name of the cookie to remove
   *
   * @example
   * // Remove an authentication cookie
   * deleteCookie('auth-token')
   *
   * // Remove a session cookie
   * deleteCookie('session-id')
   */
  const deleteCookie = (cookieName: string) => {
    if (!document || !document['x-scalar-client-config-cookies']) {
      return false
    }

    delete document['x-scalar-client-config-cookies'][cookieName]
    return true
  }

  return {
    addCookie,
    deleteCookie,
  }
}
