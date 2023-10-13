import { type Spec } from 'src/types'

export const hasModels = (spec: Spec) => {
  if (Object.keys(spec?.components?.schemas ?? {}).length) {
    return true
  }

  return false
}
