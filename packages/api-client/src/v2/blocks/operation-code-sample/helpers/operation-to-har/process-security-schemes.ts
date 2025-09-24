import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Request as HarRequest } from 'har-format'
import { encode } from 'js-base64'

type ProcessedSecuritySchemesReturn = {
  headers: HarRequest['headers']
  queryString: HarRequest['queryString']
  cookies: HarRequest['cookies']
}

/**
 * Process security schemes into whichever parameters they are applicable to
 *
 * TODO: we probably want to be able to disable YOUR_SECRET_TOKEN placeholder text + or allow it to be customzied
 */
export const processSecuritySchemes = (securitySchemes: SecuritySchemeObject[]): ProcessedSecuritySchemesReturn => {
  const result: ProcessedSecuritySchemesReturn = {
    headers: [],
    queryString: [],
    cookies: [],
  }

  for (const scheme of securitySchemes) {
    // Handle apiKey type
    if (scheme.type === 'apiKey') {
      const value = scheme['x-scalar-secret-token'] || 'YOUR_SECRET_TOKEN'
      if (!scheme.name) {
        continue
      }

      const param = { name: scheme.name, value }

      switch (scheme.in) {
        case 'header':
          result.headers.push(param)
          break
        case 'query':
          result.queryString.push(param)
          break
        case 'cookie':
          result.cookies.push(param)
          break
      }
      continue
    }

    // Handle http type
    if (scheme.type === 'http') {
      if (scheme.scheme === 'basic') {
        const username = scheme['x-scalar-secret-username'] || ''
        const password = scheme['x-scalar-secret-password'] || ''

        const value = `${username}:${password}`
        const auth = value === ':' ? 'username:password' : encode(value)

        result.headers.push({
          name: 'Authorization',
          value: `Basic ${auth}`,
        })
      } else if (scheme.scheme === 'bearer') {
        const token = scheme['x-scalar-secret-token'] || 'YOUR_SECRET_TOKEN'

        result.headers.push({
          name: 'Authorization',
          value: `Bearer ${token}`,
        })
      }
      continue
    }

    // Handle oauth2 type
    if (scheme.type === 'oauth2' && scheme.flows) {
      const flows = Object.values(scheme.flows)

      // Find the first flow with a token
      const flow = flows.find((f) => f['x-scalar-secret-token'])
      const token = flow?.['x-scalar-secret-token'] || 'YOUR_SECRET_TOKEN'

      result.headers.push({
        name: 'Authorization',
        value: `Bearer ${token}`,
      })
    }
  }

  return result
}
