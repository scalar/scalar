import type { ClientPlugin } from '@scalar/api-client/v2/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import { type ComputedRef, watch } from 'vue'

/** Map the config functions to plugins */
export const mapConfigPlugins = (config: ComputedRef<ApiReferenceConfigurationRaw>): ClientPlugin[] => {
  const plugin: ClientPlugin = { hooks: {} }

  watch(
    config,
    (newConfig) => {
      if (!plugin.hooks) {
        plugin.hooks = {}
      }

      if (newConfig.onBeforeRequest) {
        plugin.hooks.beforeRequest = async (payload) => {
          const result = await newConfig.onBeforeRequest?.(payload)

          // Just handles the void case due to the mismatch in types
          if (result === undefined) {
            return payload
          }

          return result
        }
      }

      // TODO: this does not map one-to-one with the old config
      // onRequestSent != responseReceived but we can currently use it like that for now
      if (newConfig.onRequestSent) {
        plugin.hooks.responseReceived = (payload) => {
          // TODO: matches the old config but we should update it to pass the whole response object instead
          newConfig.onRequestSent?.(payload.request.url)
        }
      }
    },
    { immediate: true },
  )

  if (plugin.hooks?.beforeRequest || plugin.hooks?.responseReceived) {
    return [plugin]
  }

  return []
}
