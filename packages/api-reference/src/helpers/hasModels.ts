import { type Spec } from 'src/types'

export const hasModels = (spec: Spec) => {
  // TODO: Let’s hide the models for now
  // if (Object.keys(spec?.components?.schemas ?? {}).length) {
  //   return true
  // }

  return false
}
