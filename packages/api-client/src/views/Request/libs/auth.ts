import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'

/** Format a scheme object into a display object */
export const displaySchemeFormatter = (s: SecurityScheme) => ({
  id: s.uid,
  label: s.type === 'openIdConnect' ? `${s.nameKey} (coming soon)` : s.nameKey,
})
