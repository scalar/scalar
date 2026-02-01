import { encode } from 'js-base64'

import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'

/** Extract secrets from security schemes */
export const getSecrets = (securitySchemes: SecuritySchemeObjectSecret[]): string[] =>
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
    .filter(Boolean)
