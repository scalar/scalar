import { isDefined } from '@scalar/helpers/array/is-defined'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { encode } from 'js-base64'

/** Extract secrets from security schemes */
export const getSecrets = (securitySchemes: SecuritySchemeObject[]): string[] =>
  securitySchemes
    .flatMap((scheme) => {
      if (scheme.type === 'apiKey') {
        return scheme['x-scalar-secret-token']
      }
      if (scheme?.type === 'http') {
        return [
          scheme['x-scalar-secret-token'],
          scheme['x-scalar-secret-username'],
          scheme['x-scalar-secret-password'],
          encode(`${scheme['x-scalar-secret-username']}:${scheme['x-scalar-secret-password']}`),
        ]
      }
      if (scheme.type === 'oauth2') {
        const flows = Object.values(scheme.flows)
        return flows.map((flow) => flow['x-scalar-secret-token'])
      }

      return []
    })
    .filter(isDefined)
