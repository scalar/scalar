import { apiReferenceConfigurationSchema, type ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { type InjectionKey, inject } from 'vue'

export const CONFIGURATION_SYMBOL = Symbol() as InjectionKey<ApiReferenceConfiguration>

/** Hook for easy access to the reference configuration */
export const useConfig = () => {
  const config = inject(CONFIGURATION_SYMBOL, apiReferenceConfigurationSchema.parse({}))
  return config
}
