import type { Spec } from '@scalar/types/legacy'

export const hasSecuritySchemes = (spec?: Spec) => {
  // TODO: Show security schemes
  if (Object.keys(spec?.components?.securitySchemes ?? {}).length) {
    return true
  }

  return false
}
