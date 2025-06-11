import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Request as HarRequest } from 'har-format'

type ProcessedSecuritySchemesReturn = {
  headers: HarRequest['headers']
  queryString: HarRequest['queryString']
  cookies: HarRequest['cookies']
}

/**
 * Process security schemes into whichever parameters they are applicable to
 */
export const processSecuritySchemes = (
  securitySchemes: OpenAPIV3_1.SecuritySchemeObject[],
): ProcessedSecuritySchemesReturn => {
  const result: ProcessedSecuritySchemesReturn = {
    headers: [],
    queryString: [],
    cookies: [],
  }

  for (const scheme of securitySchemes) {
    // Handle apiKey type
    if (scheme.type === 'apiKey') {
      const value = scheme['x-scalar-secret-token']
      if (!value || !scheme.name) {
        continue
      }

      const param = { name: scheme.name, value }

      switch (scheme.in) {
        case 'header':
          result.headers.push(param as HarRequest['headers'][0])
          break
        case 'query':
          result.queryString.push(param as HarRequest['queryString'][0])
          break
        case 'cookie':
          result.cookies.push(param as HarRequest['cookies'][0])
          break
      }
      continue
    }

    // Handle http type
    if (scheme.type === 'http') {
      if (scheme.scheme === 'basic') {
        const username = scheme['x-scalar-secret-username']
        const password = scheme['x-scalar-secret-password']
        if (!username && !password) {
          continue
        }

        const auth = Buffer.from(`${username}:${password}`).toString('base64')
        result.headers.push({
          name: 'Authorization',
          value: `Basic ${auth}`,
        })
      } else if (scheme.scheme === 'bearer') {
        const token = scheme['x-scalar-secret-token']
        if (!token) {
          continue
        }

        result.headers.push({
          name: 'Authorization',
          value: `Bearer ${token}`,
        })
      }
      continue
    }

    // Handle oauth2 type
    if (scheme.type === 'oauth2' && scheme.flows) {
      // Find the first flow with a token
      const flow = Object.values(scheme.flows).find((f) => f['x-scalar-secret-token'])
      const token = flow?.['x-scalar-secret-token']
      if (!token) {
        continue
      }

      result.headers.push({
        name: 'Authorization',
        value: `Bearer ${token}`,
      })
    }
  }

  return result
}
