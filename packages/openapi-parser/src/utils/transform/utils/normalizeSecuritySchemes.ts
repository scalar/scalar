import type { AnyObject } from '@/types/index'

export const normalizeSecuritySchemes = (definition: AnyObject) => {
  if (!definition.components?.securitySchemes) {
    return definition
  }

  const securitySchemes = { ...definition.components.securitySchemes }

  for (const scheme of Object.values(securitySchemes)) {
    if (typeof scheme === 'object' && scheme !== null && 'type' in scheme) {
      const type = String(scheme.type).toLowerCase()
      scheme.type =
        {
          apikey: 'apiKey',
          oauth2: 'oauth2',
          http: 'http',
          mutualtls: 'mutualTLS',
          openidconnect: 'openIdConnect',
        }[type] ?? type
    }
  }

  // Convert array scopes to objects
  for (const scheme of Object.values(securitySchemes)) {
    if (
      typeof scheme === 'object' &&
      scheme !== null &&
      'type' in scheme &&
      scheme.type === 'oauth2' &&
      'flows' in scheme
    ) {
      const flows = scheme.flows as AnyObject
      for (const flow of Object.values(flows)) {
        if (typeof flow === 'object' && flow !== null && 'scopes' in flow && Array.isArray(flow.scopes)) {
          flow.scopes = flow.scopes.reduce((acc: AnyObject, scope: string) => {
            acc[scope] = ''
            return acc
          }, {})
        }
      }
    }
  }

  return {
    ...definition,
    components: {
      ...definition.components,
      securitySchemes,
    },
  }
}
