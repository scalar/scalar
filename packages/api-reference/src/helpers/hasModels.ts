import { useConfigurationStore } from '../stores'
import type { Spec } from '../types'

const { configuration } = useConfigurationStore()

export const hasModels = (spec?: Spec) => {
  // Configuration
  if (configuration?.showModels === false) {
    return false
  }

  // Specification
  if (!spec) {
    return false
  }

  // Components
  if (Object.keys(spec?.components?.schemas ?? {}).length) {
    return true
  }

  return false
}
