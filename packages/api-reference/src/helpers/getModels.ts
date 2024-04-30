import type { Spec } from '../types'

export function getModels(spec?: Spec) {
  if (!spec) {
    return {}
  }

  return (
    // OpenAPI 3.x
    Object.keys(spec?.components?.schemas ?? {}).length
      ? spec?.components?.schemas
      : // Swagger 2.0
        Object.keys(spec?.definitions ?? {}).length
        ? spec?.definitions
        : // Fallback
          {}
  )
}
