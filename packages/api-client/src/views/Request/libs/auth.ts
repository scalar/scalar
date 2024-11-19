import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'

/** Format a scheme object into a display object */
export const displaySchemeFormatter = (s: SecurityScheme) => {
  return {
    id: s.uid,
    label: s.nameKey,
  }
}
