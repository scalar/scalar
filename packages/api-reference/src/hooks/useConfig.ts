import type { ApiReferenceConfiguration } from '@scalar/types/packages'
import { type InjectionKey, inject } from 'vue'

export const CONFIGURATION_SYMBOL = Symbol() as InjectionKey<ApiReferenceConfiguration>

/** Hook for easy access to the reference configuration */
export const useConfig = () => {
  const config = inject(CONFIGURATION_SYMBOL, {})
  return config
}
