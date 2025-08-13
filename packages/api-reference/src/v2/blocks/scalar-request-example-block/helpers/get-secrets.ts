import { isDefined } from '@scalar/helpers/array/is-defined'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import { XScalarSecretSchema } from '@scalar/workspace-store/schemas/extensions/x-scalar-secret'

/** Extract secrets from security schemes */
export const getSecrets = (securitySchemes: SecuritySchemeObject[]) =>
  securitySchemes
    .flatMap((scheme) => {
      const extensions = coerceValue(XScalarSecretSchema, scheme)

      if (scheme.type === 'apiKey') {
        return extensions['x-scalar-secret-token']
      }
      if (scheme?.type === 'http') {
        return [
          extensions['x-scalar-secret-token'],
          extensions['x-scalar-secret-username'],
          extensions['x-scalar-secret-password'],
          btoa(`${extensions['x-scalar-secret-username']}:${extensions['x-scalar-secret-password']}`),
        ]
      }
      if (scheme.type === 'oauth2') {
        const flows = Object.values(scheme.flows)
        return flows.map((flow) => coerceValue(XScalarSecretSchema, flow)['x-scalar-secret-token'])
      }

      return []
    })
    .filter(isDefined) as string[]
