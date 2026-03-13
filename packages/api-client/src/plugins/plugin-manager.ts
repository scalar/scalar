import type { ApiClientPlugin } from '@scalar/types/api-reference'

export type { ApiClientPlugin }

type PluginInstance = ReturnType<ApiClientPlugin>
type HookFunctions = NonNullable<PluginInstance['hooks']>
type HookEvent = keyof HookFunctions
type HookArgs<E extends HookEvent> = HookFunctions[E] extends (...args: infer Args) => unknown ? Args : never
type HookReturn<E extends HookEvent> = HookFunctions[E] extends (...args: unknown[]) => infer Result
  ? Result
  : never

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
    executeHook: <E extends HookEvent>(
      event: E,
      ...args: HookArgs<E>
    ): Promise<Array<Awaited<HookReturn<E>>>> => {
      const hooks = Array.from(registeredPlugins.values())
        .map((plugin) => plugin.hooks?.[event])
        .filter((hook): hook is NonNullable<HookFunctions[E]> => hook != null)

      // Execute each hook with the provided arguments
      return Promise.all(hooks.map((hook) => hook(...args)))
    },
  }
}

export type PluginManager = ReturnType<typeof createPluginManager>
