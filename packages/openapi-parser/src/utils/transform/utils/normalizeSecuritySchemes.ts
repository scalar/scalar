import type { AnyObject } from '../../../types'

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

  return {
    ...definition,
    components: {
      ...definition.components,
      securitySchemes,
    },
  }
}
