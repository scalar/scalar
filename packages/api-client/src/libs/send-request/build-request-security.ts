import { replaceTemplateVariables } from '@/libs/string-template'
import { cookieSchema, type Cookie } from '@scalar/oas-utils/entities/cookie'
import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'
import { isDefined } from '@scalar/oas-utils/helpers'

/**
 * Generates the headers, cookies and query params for selected security schemes
 * In the future we can add customization for where the security is applied
 */
export const buildRequestSecurity = (
  securitySchemes: SecurityScheme[] = [],
  env: object = {},
  /** Include this parameter to set the placeholder for empty tokens */
  emptyTokenPlaceholder = '',
) => {
  const headers: Record<string, string> = {}
  const cookies: Cookie[] = []
  const urlParams = new URLSearchParams()

  securitySchemes.forEach((scheme) => {
    // Scheme type and example value type should always match
    if (scheme.type === 'apiKey') {
      const value = replaceTemplateVariables(scheme.value, env) || emptyTokenPlaceholder

      if (scheme.in === 'header') {
        headers[scheme.name] = value
      }
      if (scheme.in === 'query') {
        urlParams.append(scheme.name, value)
      }
      if (scheme.in === 'cookie') {
        cookies.push(
          cookieSchema.parse({
            uid: scheme.uid,
            name: scheme.name,
            value,
            path: '/',
          }),
        )
      }
    }

    if (scheme.type === 'http') {
      if (scheme.scheme === 'basic') {
        const username = replaceTemplateVariables(scheme.username, env)
        const password = replaceTemplateVariables(scheme.password, env)
        const value = `${username}:${password}`

        headers['Authorization'] = `Basic ${value === ':' ? 'username:password' : btoa(value)}`
      } else {
        const value = replaceTemplateVariables(scheme.token, env)
        headers['Authorization'] = `Bearer ${value || emptyTokenPlaceholder}`
      }
    }

    // For OAuth we take the token from the first flow
    if (scheme.type === 'oauth2') {
      const flows = Object.values(scheme.flows)
      const token = flows.filter(isDefined).find((f) => f.token)?.token

      headers['Authorization'] = `Bearer ${token || emptyTokenPlaceholder}`
    }
  })

  return { headers, cookies, urlParams }
}
