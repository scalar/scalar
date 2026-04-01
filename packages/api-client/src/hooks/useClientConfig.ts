import { type ApiClientConfiguration, apiClientConfigurationSchema } from '@scalar/types/api-reference'
import { type InjectionKey, type Ref, inject, ref } from 'vue'

export const CLIENT_CONFIGURATION_SYMBOL = Symbol() as InjectionKey<Ref<ApiClientConfiguration>>

/** Hook for easy access to the reference configuration */
export const useClientConfig = () => inject(CLIENT_CONFIGURATION_SYMBOL, ref(apiClientConfigurationSchema.parse({})))

/**
 * Resolve the default OAuth2 redirect URI.
 *
 * Priority:
 * 1. Explicit oauth2RedirectUri config override.
 * 2. Empty string in non-browser and file:// contexts.
 * 3. Browser origin + pathname fallback.
 */
export const resolveDefaultOAuth2RedirectUri = (
  config: Pick<ApiClientConfiguration, 'oauth2RedirectUri'>,
): string => {
  if (config.oauth2RedirectUri) {
    return config.oauth2RedirectUri
  }

  if (typeof window === 'undefined' || window.location.protocol === 'file:') {
    return ''
  }

  return window.location.origin + window.location.pathname
}
