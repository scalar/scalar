import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { buildRequest, getEnvironmentVariables } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
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
export const mapConfigPlugins = (
  config: ComputedRef<ApiReferenceConfiguration>,
  environment: ComputedRef<XScalarEnvironment>,
): ClientPlugin[] => {
  // Create a new plugin with the hooks which is going to be updated by the watcher when config changes
  const plugin: ClientPlugin = { hooks: {} }

  watch(
    [() => config.value.onBeforeRequest, () => config.value.onRequestSent, () => environment.value],
    ([onBeforeRequest, onRequestSent, environment]) => {
      // Get the environment variables for the current environment
      const envVariables = getEnvironmentVariables(environment)

      // Initialize the hooks object if it doesn't exist
      if (!plugin.hooks) {
        plugin.hooks = {}
      }

      plugin.hooks.beforeRequest = onBeforeRequest
        ? async (payload) => {
            await onBeforeRequest({
              // We need to build the request to get the fetch `Request`
              request: buildRequest(payload.requestBuilder, { envVariables }).request,
              requestBuilder: payload.requestBuilder,
              envVariables,
            })
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
