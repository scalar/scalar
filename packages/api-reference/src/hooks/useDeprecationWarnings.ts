import type { ApiReferenceConfiguration } from '@scalar/types/packages'
import { watch } from 'vue'

const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
const NEW_PROXY_URL = 'https://proxy.scalar.com'

// TODO: Move this to zod

/**
 * Warns the user about deprecated configurations in the browser console.
 */
export function useDeprecationWarnings(configuration: ApiReferenceConfiguration) {
  watch(
    () => configuration,
    () => {
      if (configuration.proxy) {
        console.warn(
          `[DEPRECATED] You’re using the deprecated 'proxy' attribute, rename it to 'proxyUrl' or update the package.`,
        )
      }

      if ((configuration.proxyUrl || configuration.proxy) === OLD_PROXY_URL) {
        console.warn(`[DEPRECATED] Warning: configuration.proxyUrl points to our old proxy (${OLD_PROXY_URL}).`)

        console.warn(`[DEPRECATED] We are overwriting the value and use the new proxy URL (${NEW_PROXY_URL}) instead.`)

        // WARNING: This replaces the OLD_PROXY_URL with the NEW_PROXY_URL on the fly.
        delete configuration.proxy
        configuration.proxyUrl = NEW_PROXY_URL

        console.warn(
          `[DEPRECATED] Action Required: You should manually update your configuration to use the new URL (${NEW_PROXY_URL}). Read more: https://github.com/scalar/scalar`,
        )
      }
    },
    {
      immediate: true,
    },
  )
}
