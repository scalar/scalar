import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Convert the old security scheme to the new one with secret extensions
 *
 * Remove this once we are migrated to the workspace store
 */
export const convertSecurityScheme = (scheme: SecurityScheme): SecuritySchemeObject => {
  // ApiKey
  if (scheme.type === 'apiKey') {
    return {
      ...scheme,
      'x-scalar-secret-token': scheme.value,
    }
  }

  // HTTP
  if (scheme.type === 'http') {
    return {
      ...scheme,
      'x-scalar-secret-token': scheme.token,
      'x-scalar-secret-username': scheme.username,
      'x-scalar-secret-password': scheme.password,
    }
  }

  // OAuth2
  if (scheme.type === 'oauth2') {
    return {
      ...scheme,
      flows: Object.fromEntries(
        Object.entries(scheme.flows).map(([flowKey, flow]) => [
          flowKey,
          flow
            ? {
                ...flow,
                'x-scalar-secret-token': flow.token,
              }
            : flow,
        ]),
      ),
    }
  }

  return scheme
}
