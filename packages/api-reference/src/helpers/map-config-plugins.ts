import type { ClientPlugin } from '@scalar/api-client/v2/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'

/** Map the config functions to plugins */
export const mapConfigPlugins = (config: ApiReferenceConfigurationRaw): ClientPlugin[] => {
  const plugins: ClientPlugin[] = []

  // onBeforeRequest
  if (config.onBeforeRequest) {
    plugins.push({
      hooks: {
        beforeRequest: async (payload) => {
          const result = await config.onBeforeRequest?.(payload)

          // Just handles the void case due to the mismatch in types
          if (result) {
            return result
          }

          return payload
        },
      },
    })
  }

  // onResponseReceived
  if (config.onRequestSent) {
    plugins.push({
      hooks: {
        responseReceived: (payload) => {
          // TODO: matches the old config but we should update it to pass the whole response object instead
          config.onRequestSent?.(payload.request.url)
        },
      },
    })
  }

  return plugins
}
