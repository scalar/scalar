import { isDefined } from '@scalar/helpers/array/is-defined'
import { replaceVariables } from '@scalar/helpers/regex/replace-variables'
import {
  type XScalarCookie,
  xScalarCookieSchema,
} from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { encode } from 'js-base64'

/**
 * Generates the headers, cookies and query params for selected security schemes
 * In the future we can add customization for where the security is applied
 */
export const buildRequestSecurity = (
  securitySchemes: SecuritySchemeObject[] = [],
  /** Environment variables flattened into a key-value object */
  env: Record<string, string> = {},
  /** Include this parameter to set the placeholder for empty tokens */
  emptyTokenPlaceholder = '',
): { headers: Record<string, string>; cookies: XScalarCookie[]; urlParams: URLSearchParams } => {
  const headers: Record<string, string> = {}
  const cookies: XScalarCookie[] = []
  const urlParams = new URLSearchParams()

  securitySchemes.forEach((scheme) => {
    // Scheme type and example value type should always match
    if (scheme.type === 'apiKey') {
      const value = replaceVariables(scheme['x-scalar-secret-token'], env) || emptyTokenPlaceholder

      if (scheme.in === 'header') {
        headers[scheme.name] = value
      }
      if (scheme.in === 'query') {
        urlParams.append(scheme.name, value)
      }
      if (scheme.in === 'cookie') {
        cookies.push(
          coerceValue(xScalarCookieSchema, {
            name: scheme.name,
            value,
            path: '/',
          }),
        )
      }
    }

    if (scheme.type === 'http') {
      if (scheme.scheme === 'basic') {
        const username = replaceVariables(scheme['x-scalar-secret-username'], env)
        const password = replaceVariables(scheme['x-scalar-secret-password'], env)
        const value = `${username}:${password}`

        headers['Authorization'] = `Basic ${value === ':' ? 'username:password' : encode(value)}`
      } else {
        const value = replaceVariables(scheme['x-scalar-secret-token'], env)
        headers['Authorization'] = `Bearer ${value || emptyTokenPlaceholder}`
      }
    }

    // For OAuth we take the token from the first flow
    if (scheme.type === 'oauth2') {
      const flows = Object.values(scheme.flows)
      const token = flows.filter(isDefined).find((f) => f['x-scalar-secret-token'])?.['x-scalar-secret-token']

      headers['Authorization'] = `Bearer ${token || emptyTokenPlaceholder}`
    }
  })

  return { headers, cookies, urlParams }
}
