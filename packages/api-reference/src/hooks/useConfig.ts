import { apiReferenceConfigurationSchema, type ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { type ComputedRef, type InjectionKey, computed, inject } from 'vue'

export const CONFIGURATION_SYMBOL = Symbol() as InjectionKey<ComputedRef<ApiReferenceConfiguration>>

/** Hook for easy access to the reference configuration */
export const useConfig = () => {
  const config = inject(
    CONFIGURATION_SYMBOL,
    computed(() => apiReferenceConfigurationSchema.parse({})),
  )
  return config
}
