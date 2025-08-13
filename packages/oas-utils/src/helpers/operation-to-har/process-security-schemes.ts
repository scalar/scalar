import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import type { Request as HarRequest } from 'har-format'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { XScalarSecretSchema } from '@scalar/workspace-store/schemas/extensions/x-scalar-secret'

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
    const extensions = coerceValue(XScalarSecretSchema, scheme)

    // Handle apiKey type
    if (scheme.type === 'apiKey') {
      const value = (extensions['x-scalar-secret-token'] || 'YOUR_SECRET_TOKEN') as string
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
        const username = extensions['x-scalar-secret-username'] || ''
        const password = extensions['x-scalar-secret-password'] || ''

        const value = `${username}:${password}`
        const auth = value === ':' ? 'username:password' : Buffer.from(value).toString('base64')

        result.headers.push({
          name: 'Authorization',
          value: `Basic ${auth}`,
        })
      } else if (scheme.scheme === 'bearer') {
        const token = extensions['x-scalar-secret-token'] || 'YOUR_SECRET_TOKEN'

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
      const flow = flows.map((flow) => coerceValue(XScalarSecretSchema, flow)).find((f) => f['x-scalar-secret-token'])
      const token = flow?.['x-scalar-secret-token'] || 'YOUR_SECRET_TOKEN'

      result.headers.push({
        name: 'Authorization',
        value: `Bearer ${token}`,
      })
    }
  }

  return result
}
