import type { OpenAPI } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'

import { getModels } from './getModels'

export const hasModels = (spec?: Spec | OpenAPI.Document) => {
  if (!spec) {
    return false
  }

  if (Object.keys(getModels(spec) ?? {}).length) {
    return true
  }

  return false
}
