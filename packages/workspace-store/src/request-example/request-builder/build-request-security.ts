import { isDefined } from '@scalar/helpers/array/is-defined'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  type XScalarCookie,
  xScalarCookieSchema,
} from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { SecurityRequirementObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { encode } from 'js-base64'

import type { MergedSecuritySchemes } from '@/v2/blocks/scalar-auth-selector-block/helpers/merge-security'
import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'

/**
 * Get the selected security schemes from security requirements.
 * Takes security requirement objects and resolves them to actual security scheme objects.
 */
export const getSecuritySchemes = (
  securitySchemes: MergedSecuritySchemes,
  selectedSecurity: SecurityRequirementObject[],
): SecuritySchemeObjectSecret[] =>
  selectedSecurity.flatMap((scheme) =>
    objectKeys(scheme).flatMap((key) => {
      const scheme = getResolvedRef(securitySchemes?.[key])
      if (scheme) {
        return scheme
      }

      return []
    }),
  ) ?? []

/**
 * Generates the headers, cookies and query params for selected security schemes
 * In the future we can add customization for where the security is applied
 */
export const buildRequestSecurity = (
  /** Currently selected security for the current operation */
  selectedSecuritySchemes: SecuritySchemeObjectSecret[],
  /** Environment variables flattened into a key-value object */
  env: Record<string, string> = {},
  /** Include this parameter to set the placeholder for empty tokens */
  emptyTokenPlaceholder = '',
): { headers: Record<string, string>; cookies: XScalarCookie[]; urlParams: URLSearchParams } => {
  const headers: Record<string, string> = {}
  const cookies: XScalarCookie[] = []
  const urlParams = new URLSearchParams()

  selectedSecuritySchemes.forEach((scheme) => {
    // Api key
    if (scheme.type === 'apiKey') {
      const name = replaceEnvVariables(scheme.name, env)
      const value = replaceEnvVariables(scheme['x-scalar-secret-token'], env) || emptyTokenPlaceholder

      if (scheme.in === 'header') {
        headers[name] = value
      }
      if (scheme.in === 'query') {
        urlParams.append(name, value)
      }
      if (scheme.in === 'cookie') {
        cookies.push(
          coerceValue(xScalarCookieSchema, {
            name,
            value,
            path: '/',
          }),
        )
      }
    }

    // HTTP
    if (scheme.type === 'http') {
      if (scheme.scheme === 'basic') {
        const username = replaceEnvVariables(scheme['x-scalar-secret-username'], env)
        const password = replaceEnvVariables(scheme['x-scalar-secret-password'], env)
        const value = `${username}:${password}`

        headers['Authorization'] = `Basic ${value === ':' ? 'username:password' : encode(value)}`
      } else {
        const value = replaceEnvVariables(scheme['x-scalar-secret-token'], env)
        headers['Authorization'] = `Bearer ${value || emptyTokenPlaceholder}`
      }
    }

    // OAuth2
    if (scheme.type === 'oauth2') {
      const flows = Object.values(scheme?.flows ?? {})
      const token = replaceEnvVariables(
        flows.filter(isDefined).find((f) => f['x-scalar-secret-token'])?.['x-scalar-secret-token'] ?? '',
        env,
      )

      headers['Authorization'] = `Bearer ${token || emptyTokenPlaceholder}`
    }
  })

  return { headers, cookies, urlParams }
}
