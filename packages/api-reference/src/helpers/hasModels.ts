import type { Spec } from '../types'
import { getModels } from './getModels'

export const hasModels = (spec?: Spec) => {
  if (!spec) {
    return false
  }

  if (Object.keys(getModels(spec) ?? {}).length) {
    return true
  }

  return false
}
