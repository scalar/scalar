import type { ClientPlugin } from '@scalar/api-client/v2/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import { type ComputedRef, watch } from 'vue'

/**
 * Maps API reference configuration callbacks to client plugins.
 *
 * This function transforms the legacy onBeforeRequest and onRequestSent callbacks
 * into the new plugin hook system. The mapping is reactive, so changes to the
 * configuration will automatically update the plugin hooks.
 *
 * Note: onRequestSent is mapped to responseReceived hook. This is not a perfect
 * one-to-one mapping, but it maintains backward compatibility with the old API.
 * The old callback receives only the URL string, while the new hook receives
 * the full response object.
 *
 * @param config - Reactive configuration object containing optional hook callbacks
 * @returns Array containing a single plugin with the mapped hooks
 */
export const mapConfigPlugins = (config: ComputedRef<ApiReferenceConfigurationRaw>): ClientPlugin[] => {
  const plugin: ClientPlugin = { hooks: {} }

  watch(
    [() => config.value.onBeforeRequest, () => config.value.onRequestSent],
    ([onBeforeRequest, onRequestSent]) => {
      if (!plugin.hooks) {
        plugin.hooks = {}
      }

      plugin.hooks.beforeRequest = onBeforeRequest
        ? async (payload) => {
            const result = await onBeforeRequest(payload)

            /**
             * When the callback returns void (for side-effect only callbacks like logging),
             * we return the original payload to keep the request pipeline working.
             */
            if (result === undefined) {
              return payload
            }

            return result
          }
        : undefined

      /**
       * Maps onRequestSent to responseReceived hook.
       * The old API only passed the URL string, so we extract it from the request.
       */
      plugin.hooks.responseReceived = onRequestSent
        ? (payload) => {
            onRequestSent(payload.request.url)
          }
        : undefined
    },
    { immediate: true },
  )

  return [plugin]
}
