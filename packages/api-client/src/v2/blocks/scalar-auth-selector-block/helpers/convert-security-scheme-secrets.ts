import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type OAuthFlowsObject,
  type SecuritySchemeObject,
  SecuritySchemeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { PartialDeep } from 'type-fest'

/**
 * Mapping of field names to their corresponding x-scalar-secret extension names.
 */
const SECRET_FIELD_MAPPINGS = {
  clientSecret: 'x-scalar-secret-client-secret',
  password: 'x-scalar-secret-password',
  token: 'x-scalar-secret-token',
  username: 'x-scalar-secret-username',
  value: 'x-scalar-secret-token',
  'x-scalar-client-id': 'x-scalar-secret-client-id',
  'x-scalar-redirect-uri': 'x-scalar-secret-redirect-uri',
} as const

/**
 * Adds x-scalar-secret extensions for fields that exist but do not already have a secret extension.
 * Only adds the secret extension if the field value is truthy (not empty string, null, or undefined).
 */
const addSecretExtensions = <T extends Record<string, unknown>>(obj: T): T => {
  const result: Record<string, unknown> = { ...obj }

  for (const [field, secretField] of objectEntries(SECRET_FIELD_MAPPINGS)) {
    if (!obj[field]) {
      continue
    }

    result[secretField] ||= obj[field]
  }

  return result as T
}

/**
 * Convert the old security scheme to the new one with secret extensions
 */
export const convertSecuritySchemeSecrets = (
  scheme: PartialDeep<SecurityScheme & SecuritySchemeObject>,
): SecuritySchemeObject => {
  // OAuth2
  if (scheme.type === 'oauth2') {
    const selectedScopes = new Set()

    /** Add secret extensions to the flows + gather selected scopes */
    const flows = objectEntries(scheme.flows ?? {}).reduce(
      (acc, [flowKey, flow]) => {
        acc[flowKey] = flow ? addSecretExtensions(flow) : flow
        flow?.selectedScopes?.forEach((scope) => selectedScopes.add(scope))
        return acc
      },
      {} as PartialDeep<OAuthFlowsObject>,
    )

    /** Overwrite the default scopes if we have selected scopes and no default scopes are set */
    const defaultScopes =
      selectedScopes.size > 0 && !scheme['x-default-scopes']?.length
        ? { 'x-default-scopes': Array.from(selectedScopes) }
        : {}

    const coerced = coerceValue<SecuritySchemeObject>(SecuritySchemeObjectSchema, {
      ...scheme,
      flows,
      ...defaultScopes,
    })
    return coerced
  }

  // non-oauth2 schemes
  return coerceValue<SecuritySchemeObject>(SecuritySchemeObjectSchema, addSecretExtensions(scheme))
}
