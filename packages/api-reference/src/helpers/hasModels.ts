import { type Spec } from '../types'

export const hasModels = (spec?: Spec) => {
  if (!spec) {
    return false
  }

  if (Object.keys(spec?.components?.schemas ?? {}).length) {
    return true
  }

  return false
}
