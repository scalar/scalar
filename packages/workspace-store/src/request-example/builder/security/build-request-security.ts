import { isDefined } from '@scalar/helpers/array/is-defined'

import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'

/**
 * BuildRequestSecurityResult
 *
 * Represents an extracted and normalized security credential for an OpenAPI operation input,
 * to be used directly when building HTTP requests (headers, query params, or cookies).
 *
 * This type is produced by the security builder whenever a user selects a security scheme
 * (such as API key, HTTP Basic, or HTTP Bearer) for an operation. Each object here maps directly
 * to one HTTP request authentication mechanism, with its resolved, ready-to-use value.
 *
 * Detailed Fields:
 * - `in`: Where to apply this security value in the outgoing HTTP request.
 *   - `'header'`: Set as an HTTP header (e.g., `Authorization`, or API key header).
 *   - `'query'`: Set as a query parameter (e.g., `/path?apikey=123`).
 *   - `'cookie'`: Set as a cookie header (`Cookie: apikey=123`).
 *
 * - `name`: The key name to use for the security credential in the selected location.
 *   - For headers/params, the header or query name.
 *   - For cookies, the cookie key.
 *
 * - `format` (optional): Clarifies the expected format, especially for HTTP schemes.
 *   - `'basic'`: HTTP Basic Auth.
 *   - `'bearer'`: HTTP Bearer token.
 *   - Not present for schemes without a special format (e.g., generic API keys).
 *
 * - `value`: The fully resolved secret value to use in the request.
 *   - This may already include necessary prefixes (e.g., "Bearer x", "Basic y"),
 *     or be a direct value depending on the scheme and usage.
 *
 * NOTE: This type does not capture UI display info, secret labels, or environment binding.
 * It is intended purely for producing the final request input object. Multiple
 * BuildRequestSecurityResult objects may be generated from a single operation if multiple
 * security schemes are selected and must be included simultaneously.
 */
export type BuildRequestSecurityResult = {
  /** The location of the security scheme in the HTTP request */
  in: 'header' | 'query' | 'cookie'
  /** The key/name for the authentication value (header/query/cookie name) */
  name: string
  /** Format code for HTTP schemes (e.g., 'basic' | 'bearer'), if relevant */
  format?: 'basic' | 'bearer'
  /**
   * The fully resolved authentication value to use (may include tokens, encoded credentials, etc.)
   */
  value: string
}

/**
 * Generates the headers, cookies and query params for selected security schemes
 * In the future we can add customization for where the security is applied
 */
export const buildRequestSecurity = (
  /** Currently selected security for the current operation */
  selectedSecuritySchemes: SecuritySchemeObjectSecret[],
  /** Include this parameter to set the placeholder for empty tokens */
  emptyTokenPlaceholder = '',
): BuildRequestSecurityResult[] => {
  const result: BuildRequestSecurityResult[] = []

  selectedSecuritySchemes.forEach((scheme) => {
    // Api key
    if (scheme.type === 'apiKey') {
      const name = scheme.name
      const value = scheme['x-scalar-secret-token'] || emptyTokenPlaceholder

      if (scheme.in === 'header') {
        return result.push({
          in: scheme.in,
          name,
          value,
        })
      }
      if (scheme.in === 'query') {
        return result.push({
          in: 'query',
          name,
          value,
        })
      }
      if (scheme.in === 'cookie') {
        return result.push({
          in: 'cookie',
          name,
          value,
        })
      }
    }

    // HTTP
    if (scheme.type === 'http') {
      if (scheme.scheme === 'basic') {
        const username = scheme['x-scalar-secret-username']
        const password = scheme['x-scalar-secret-password']
        const value = `${username}:${password}`

        return result.push({
          in: 'header',
          name: 'Authorization',
          // We encode the value when we build the request since we want to be able to replace the variables in the value
          value: value === ':' ? 'username:password' : value,
          format: 'basic',
        })
      }
      // Bearer auth
      const value = scheme['x-scalar-secret-token']
      return result.push({
        in: 'header',
        name: 'Authorization',
        value: value || emptyTokenPlaceholder,
        format: 'bearer',
      })
    }

    // OAuth2
    if (scheme.type === 'oauth2') {
      const flows = Object.values(scheme?.flows ?? {})
      const token = flows.filter(isDefined).find((f) => f['x-scalar-secret-token'])?.['x-scalar-secret-token'] ?? ''

      return result.push({
        in: 'header',
        name: 'Authorization',
        value: token || emptyTokenPlaceholder,
        format: 'bearer',
      })
    }

    // OpenID Connect
    if (scheme.type === 'openIdConnect') {
      const flows = Object.values(scheme?.flows ?? {})
      const token = flows.filter(isDefined).find((f) => f['x-scalar-secret-token'])?.['x-scalar-secret-token'] ?? ''

      return result.push({
        in: 'header',
        name: 'Authorization',
        value: token || emptyTokenPlaceholder,
        format: 'bearer',
      })
    }

    return null
  })

  return result
}
