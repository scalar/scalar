import {
  type SecurityScheme,
  securitySchemeExampleValueSchema,
} from '@scalar/oas-utils/entities/spec'

/** Create a new value set for a given scheme type */
export const createSchemeValueSet = (scheme: SecurityScheme) => {
  // Determine the value entry type
  const valueType =
    scheme.type === 'oauth2' ? `oauth-${scheme.flow.type}` : scheme.type

  return securitySchemeExampleValueSchema.parse({
    type: valueType,
  })
}

/** Format a scheme object into a display object */
export const displaySchemeFormatter = (s: SecurityScheme) => {
  return {
    id: s.uid,
    label: s.nameKey,
  }
}
