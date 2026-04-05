import { isDefined } from '@scalar/helpers/array/is-defined'

import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'

export type BuildRequestSecurityResult = {
  /** The location of the security scheme */
  in: 'header' | 'query' | 'cookie'
  /** The name of the security scheme */
  name: string
  /** The type of security scheme */
  type: 'simple' | 'basic' | 'bearer'
  /**
   * The value of the security scheme
   * For basic auth we need to base64 encode the value when we build the request
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
          type: 'simple',
        })
      }
      if (scheme.in === 'query') {
        return result.push({
          in: 'query',
          name,
          value,
          type: 'simple',
        })
      }
      if (scheme.in === 'cookie') {
        return result.push({
          in: 'cookie',
          name,
          value,
          type: 'simple',
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
          type: 'basic',
        })
      }
      // Bearer auth
      const value = scheme['x-scalar-secret-token']
      return result.push({
        in: 'header',
        name: 'Authorization',
        value: value || emptyTokenPlaceholder,
        type: 'bearer',
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
        type: 'bearer',
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
        type: 'bearer',
      })
    }

    return null
  })

  return result
}
