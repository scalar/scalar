import type { ApiClientPlugin } from '@scalar/types/api-reference'

export type { ApiClientPlugin }

type PluginInstance = ReturnType<ApiClientPlugin>
type HookFunctions = NonNullable<PluginInstance['hooks']>
type HookEvent = keyof HookFunctions
type OnBeforeRequestHook = NonNullable<HookFunctions['onBeforeRequest']>
type OnResponseReceivedHook = NonNullable<HookFunctions['onResponseReceived']>

type ExecuteHook = {
  (
    event: 'onBeforeRequest',
    ...args: Parameters<OnBeforeRequestHook>
  ): Promise<Array<Awaited<ReturnType<OnBeforeRequestHook>>>>
  (
    event: 'onResponseReceived',
    ...args: Parameters<OnResponseReceivedHook>
  ): Promise<Array<Awaited<ReturnType<OnResponseReceivedHook>>>>
}

type CreatePluginManagerParams = {
  plugins?: ApiClientPlugin[]
}

/**
 * Create the plugin manager store
 *
 * This store manages all plugins registered with the API client
 */
export const createPluginManager = ({ plugins = [] }: CreatePluginManagerParams) => {
  const registeredPlugins = new Map<string, ReturnType<ApiClientPlugin>>()

  // Register initial plugins
  plugins.forEach((plugin) => {
    const pluginInstance = plugin()
    registeredPlugins.set(pluginInstance.name, pluginInstance)
  })

  const executeHook: ExecuteHook = (
    event: HookEvent,
    ...args: Parameters<OnBeforeRequestHook> | Parameters<OnResponseReceivedHook>
  ) => {
    const [payload] = args

    if (event === 'onBeforeRequest' && payload && 'request' in payload) {
      const hooks = Array.from(registeredPlugins.values())
        .map((plugin) => plugin.hooks?.onBeforeRequest)
        .filter((hook): hook is OnBeforeRequestHook => typeof hook === 'function')

      // Execute each hook with the provided arguments
      return Promise.all(hooks.map((hook) => hook({ request: payload.request })))
    }

    if (event === 'onResponseReceived' && payload && 'response' in payload && 'operation' in payload) {
      const hooks = Array.from(registeredPlugins.values())
        .map((plugin) => plugin.hooks?.onResponseReceived)
        .filter((hook): hook is OnResponseReceivedHook => typeof hook === 'function')

      // Execute each hook with the provided arguments
      return Promise.all(hooks.map((hook) => hook({ response: payload.response, operation: payload.operation })))
    }

    return Promise.resolve([])
  }

  return {
    /**
     * Get all components for a specific view
     */
    getViewComponents: (view: keyof NonNullable<ReturnType<ApiClientPlugin>['views']>) => {
      return Array.from(registeredPlugins.values()).flatMap((plugin) => plugin.views?.[view] || [])
    },

    /**
     * Execute a hook for a specific event
     */
    executeHook,
  }
}

export type PluginManager = ReturnType<typeof createPluginManager>
