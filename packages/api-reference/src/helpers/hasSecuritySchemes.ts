import type { Spec } from '@scalar/oas-utils'

export const hasSecuritySchemes = (spec?: Spec) => {
  // TODO: Show security schemes
  if (Object.keys(spec?.components?.securitySchemes ?? {}).length) {
    return true
  }

  return false
}
