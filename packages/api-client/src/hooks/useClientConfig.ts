import { apiClientConfigurationSchema, type ApiClientConfiguration } from '@scalar/types/api-reference'
import { type InjectionKey, type Ref, inject, ref } from 'vue'

export const CLIENT_CONFIGURATION_SYMBOL = Symbol() as InjectionKey<Ref<ApiClientConfiguration>>

/** Hook for easy access to the reference configuration */
export const useClientConfig = () => inject(CLIENT_CONFIGURATION_SYMBOL, ref(apiClientConfigurationSchema.parse({})))
