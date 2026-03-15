import type { ApiClientPlugin, hooksSchema } from '@scalar/types/api-reference'
import type { z } from 'zod'

export type { ApiClientPlugin }

type HookFunctions = z.infer<typeof hooksSchema>
type HookName = keyof HookFunctions
type HookArgs<E extends HookName> =
  NonNullable<HookFunctions[E]> extends (...args: infer Args) => unknown ? Args : never

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
    executeHook: <E extends HookName>(event: E, ...args: HookArgs<E>) => {
      const hooks: NonNullable<HookFunctions[E]>[] = []

      Array.from(registeredPlugins.values()).forEach((plugin) => {
        const hook = plugin.hooks?.[event]

        if (hook) {
          hooks.push(hook)
        }
      })

      // Execute each hook with the provided arguments
      return Promise.all(hooks.map((hook) => hook(...args)))
    },
  }
}

export type PluginManager = ReturnType<typeof createPluginManager>
