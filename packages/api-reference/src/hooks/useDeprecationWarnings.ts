import { watch } from 'vue'

import type { ReferenceConfiguration } from '../types'

const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
const NEW_PROXY_URL = 'https://proxy.scalar.com'
const LOCAL_PROXY_URL = 'http://localhost:5051'

export function useDeprecationWarnings(configuration: ReferenceConfiguration) {
  watch(
    () => configuration,
    () => {
      if (configuration.proxy === OLD_PROXY_URL) {
        console.warn(
          `[DEPRECATED] Warning: configuration.proxy points to our old proxy (${OLD_PROXY_URL}).`,
        )

        console.warn(
          `[DEPRECATED] We are overwriting the value and use the new proxy URL (${NEW_PROXY_URL}) instead.`,
        )

        // WARNING: This replaces the OLD_PROXY_URL with the NEW_PROXY_URL on the fly.
        configuration.proxy = NEW_PROXY_URL

        console.warn(
          `[DEPRECATED] Action Required: You should manually update your configuration to use the new URL (${NEW_PROXY_URL}). Read more: https://github.com/scalar/scalar`,
        )
      } else if (
        configuration.proxy?.length &&
        configuration.proxy !== NEW_PROXY_URL &&
        configuration.proxy !== LOCAL_PROXY_URL
      ) {
        console.warn(
          `[DEPRECATED] Warning: configuration.proxy points to a custom proxy (${configuration?.proxy}).`,
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
