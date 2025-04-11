import { apiReferenceConfigurationSchema, type ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { type ComputedRef, type InjectionKey, computed, inject } from 'vue'

export const CONFIGURATION_SYMBOL = Symbol() as InjectionKey<ComputedRef<ApiReferenceConfiguration>>

/**
 * New hook for reactive access to the client config
 * TODO: we need to move some properties from the store this way so that they are reactive
 */
export const useConfig = () => {
  const config = inject(
    CONFIGURATION_SYMBOL,
    computed(() => apiReferenceConfigurationSchema.parse({})),
  )
  return config
}
