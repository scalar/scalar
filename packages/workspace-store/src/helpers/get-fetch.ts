import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { UrlDoc } from '@scalar/workspace-store/client'

/**
 * Get the fetch function from the configuration
 *
 * @param config - The API reference configuration.
 * @returns The fetch function.
 */
export const getFetch = (
  config: Partial<Pick<ApiReferenceConfigurationRaw, 'fetch' | 'proxyUrl'>>,
): NonNullable<UrlDoc['fetch']> => {
  if (config.fetch) {
    return config.fetch
  }

  return ((input, init) => fetch(redirectToProxy(config.proxyUrl, input.toString()), init)) satisfies UrlDoc['fetch']
}
