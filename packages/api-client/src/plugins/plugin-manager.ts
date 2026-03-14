import type { ApiClientPlugin, hooksSchema } from '@scalar/types/api-reference'
import type { z } from 'zod'

export type { ApiClientPlugin }

type HookFunctions = z.infer<typeof hooksSchema>
type HookEvent = keyof HookFunctions
type HookHandler<E extends HookEvent> = NonNullable<HookFunctions[E]>

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
      ...args: Parameters<HookHandler<E>>
    ) => {
      const hooks = Array.from(registeredPlugins.values())
        .map((plugin) => plugin.hooks?.[event])
        .filter((hook): hook is HookHandler<E> => hook != null)

      // Execute each hook with the provided arguments
      return Promise.all(hooks.map((hook) => hook(...args)))
    },
  }
}

export type PluginManager = ReturnType<typeof createPluginManager>
