import type { ReferenceConfiguration } from '@scalar/types/legacy'
import { watch } from 'vue'

const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
const NEW_PROXY_URL = 'https://proxy.scalar.com'
const LOCAL_PROXY_URL = 'http://localhost:5051'

/**
 * Warns the user about deprecated configurations in the browser console.
 */
export function useDeprecationWarnings(configuration: ReferenceConfiguration) {
  watch(
    () => configuration,
    () => {
      if (configuration.proxy) {
        console.warn(
          `[DEPRECATED] Warning: You’re using the deprecated proxy attribute, please rename it to proxyUrl.`,
        )
      }

      if ((configuration.proxyUrl || configuration.proxy) === OLD_PROXY_URL) {
        console.warn(
          `[DEPRECATED] Warning: configuration.proxyUrl points to our old proxy (${OLD_PROXY_URL}).`,
        )

        console.warn(
          `[DEPRECATED] We are overwriting the value and use the new proxy URL (${NEW_PROXY_URL}) instead.`,
        )

        // WARNING: This replaces the OLD_PROXY_URL with the NEW_PROXY_URL on the fly.
        delete configuration.proxy
        configuration.proxyUrl = NEW_PROXY_URL

        console.warn(
          `[DEPRECATED] Action Required: You should manually update your configuration to use the new URL (${NEW_PROXY_URL}). Read more: https://github.com/scalar/scalar`,
        )
      } else if (
        configuration.proxyUrl?.length &&
        configuration.proxyUrl !== NEW_PROXY_URL &&
        configuration.proxyUrl !== LOCAL_PROXY_URL
      ) {
        console.warn(
          `[DEPRECATED] Warning: configuration.proxyUrl points to a custom proxy (${configuration?.proxyUrl || configuration?.proxy}).`,
        )
        console.warn(
          `[DEPRECATED] Action Required: You need to use our new proxy (written in Go). Read more: https://github.com/scalar/scalar/tree/main/examples/proxy-server`,
        )
      }
    },
    {
      immediate: true,
    },
  )
}
