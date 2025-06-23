import type { ApiClientPlugin, HooksSchema } from '@scalar/types/api-client'
import type { InjectionKey } from 'vue'
import type { z } from 'zod'

export type { ApiClientPlugin }

// Extract the hook function types from the schema
type HookFunctions = z.infer<typeof HooksSchema>

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
    getViewComponents: (view: keyof ReturnType<ApiClientPlugin>['views']) => {
      return Array.from(registeredPlugins.values()).flatMap((plugin) => plugin.views[view] || [])
    },

    /**
     * Execute a hook for a specific event
     */
    executeHook: <E extends keyof HookFunctions>(
      event: E,
      ...args: HookFunctions[E] extends z.ZodFunction<infer Args, any> ? z.infer<Args> : never
    ) => {
      const hooks = Array.from(registeredPlugins.values()).flatMap(
        (plugin) => plugin.hooks[event as keyof typeof plugin.hooks] || [],
      )

      // Execute each hook with the provided arguments
      return Promise.all(hooks.map((hook) => (hook as HookFunctions[E])(...args)))
    },
  }
}

export type PluginManager = ReturnType<typeof createPluginManager>
export const PLUGIN_MANAGER_SYMBOL = Symbol() as InjectionKey<PluginManager>
