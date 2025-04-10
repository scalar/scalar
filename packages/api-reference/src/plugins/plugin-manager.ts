import type { OpenApiExtension, ApiReferencePlugin as OriginalApiReferencePlugin } from '@scalar/types/api-reference'
import { type InjectionKey, inject } from 'vue'

export type ApiReferencePlugin = OriginalApiReferencePlugin

type CreatePluginManagerParams = {
  plugins?: ApiReferencePlugin[]
}

/**
 * Create the plugin manager store
 *
 * This store manages all plugins registered with the API client
 */
export const createPluginManager = ({ plugins = [] }: CreatePluginManagerParams) => {
  const registeredPlugins = new Map<string, ReturnType<ApiReferencePlugin>>()

  // Register initial plugins
  plugins.forEach((plugin) => {
    const pluginInstance = plugin()
    registeredPlugins.set(pluginInstance.name, pluginInstance)
  })

  return {
    /**
     * Get all extensions with the given name from registered plugins
     */
    getOpenApiExtensions: (name: `x-${string}`): OpenApiExtension[] => {
      return Array.from(registeredPlugins.values())
        .flatMap((plugin) => plugin.extensions)
        .filter((extension) => extension.name === name)
    },
  }
}

export type PluginManager = ReturnType<typeof createPluginManager>
export const PLUGIN_MANAGER_SYMBOL = Symbol() as InjectionKey<PluginManager>

/**
 * Hook to access the plugin manager
 *
 * @throws Error if plugin manager is not provided
 */
export const usePluginManager = (): PluginManager => {
  const manager = inject(PLUGIN_MANAGER_SYMBOL)

  if (!manager) {
    throw new Error('Plugin manager not provided')
  }

  return manager
}
