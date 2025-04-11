import type {
  ApiReferencePlugin as OriginalApiReferencePlugin,
  SpecificationExtension,
} from '@scalar/types/api-reference'

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
    getSpecificationExtensions: (name: `x-${string}`): SpecificationExtension[] => {
      const extensions: SpecificationExtension[] = []

      for (const plugin of registeredPlugins.values()) {
        for (const extension of plugin.extensions) {
          if (extension.name === name) {
            extensions.push(extension)
          }
        }
      }

      return extensions
    },
  }
}

export type PluginManager = ReturnType<typeof createPluginManager>
