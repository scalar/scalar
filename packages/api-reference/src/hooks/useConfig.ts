import type { ReferenceConfiguration } from '@/types'
import { type InjectionKey, inject } from 'vue'

export const CONFIGURATION_SYMBOL =
  Symbol() as InjectionKey<ReferenceConfiguration>

/** Hook for easy access to the reference configuration */
export const useConfig = () => {
  const config = inject(CONFIGURATION_SYMBOL, {})
  return config
}
