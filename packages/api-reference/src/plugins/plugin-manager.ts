import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type {
  ApiReferencePlugin as OriginalApiReferencePlugin,
  PluginAuthState,
  SpecificationExtension,
  ViewComponent,
} from '@scalar/types/api-reference'

export type ApiReferencePlugin = OriginalApiReferencePlugin

export type { PluginAuthState }

type CreatePluginManagerParams = {
  plugins?: ApiReferencePlugin[]
  /**
   * Read-only accessor for the global authentication state.
   *
   * Passed through to plugin lifecycle hooks and exposed via `getAuthState`, letting plugins read
   * stored secrets and the selected security schemes without being able to mutate them.
   */
  auth?: PluginAuthState
}

/**
 * A no-op auth state used when no accessor is provided (e.g. in tests or a standalone manager).
 * It reports an empty authentication state so plugins can call the read methods unconditionally.
 */
const createEmptyAuthState = (): PluginAuthState => ({
  export: () => ({}),
  getAuthSecrets: () => undefined,
  getAuthSelectedSchemas: () => undefined,
})

/** Plugin view slots that can render custom components in the content area */
const PLUGIN_VIEW_NAMES = ['content.start', 'content.end'] as const

type PluginViewName = (typeof PLUGIN_VIEW_NAMES)[number]

/** A plugin view component paired with the stable id used for the DOM and sidebar navigation */
export type PluginViewComponent = ViewComponent & { id: string }

/** A sidebar entry contributed by a plugin view */
type PluginSidebarEntry = {
  id: string
  label: string
  viewName: PluginViewName
}

/**
 * Build a stable, unique id for a plugin view component.
 *
 * The same id is used as the DOM element id (so scroll navigation can find it) and as the
 * sidebar navigation entry id (so clicking it scrolls to the element). Keeping both in sync
 * is what lets plugin views participate in the existing scroll-spy and navigation logic.
 *
 * The id is prefixed with the document slug so it matches the navigation id convention. That is
 * what lets URL deep-linking work: `getIdFromUrl` re-prepends the document slug on initial load,
 * so a hash like `plugin-view/<plugin>/<view>/<index>` resolves back to this exact id.
 */
const getPluginViewId = (documentSlug: string, pluginName: string, viewName: PluginViewName, index: number): string =>
  `${documentSlug}/plugin-view/${pluginName}/${viewName}/${index}`

/**
 * Create the plugin manager store
 *
 * This store manages all plugins registered with the API client
 */
export const createPluginManager = ({ plugins = [], auth }: CreatePluginManagerParams) => {
  const registeredPlugins = new Map<string, ReturnType<ApiReferencePlugin>>()

  // Fall back to an empty read-only auth state so hooks and `getAuthState` always have an accessor.
  const authState = auth ?? createEmptyAuthState()

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

    /**
     * Get all components for a specific view from registered plugins.
     *
     * Each component carries a stable `id` (scoped to the active document slug) so the rendered
     * DOM element and the sidebar entry (see `getSidebarEntries`) share the same id and stay in
     * sync for scroll navigation and deep-linking.
     */
    getViewComponents: (viewName: PluginViewName, documentSlug: string): PluginViewComponent[] => {
      const components: PluginViewComponent[] = []

      for (const plugin of registeredPlugins.values()) {
        const viewComponents = plugin.views?.[viewName]
        if (viewComponents) {
          viewComponents.forEach((component: ViewComponent, index: number) => {
            components.push({ ...component, id: getPluginViewId(documentSlug, plugin.name, viewName, index) })
          })
        }
      }

      return components
    },

    /**
     * Notify all plugins that the API Reference has been initialized
     */
    notifyInit: (config: Record<string, unknown>): void => {
      for (const plugin of registeredPlugins.values()) {
        plugin.hooks?.onInit?.({ config, auth: authState })
      }
    },

    /**
     * Notify all plugins that the configuration has changed
     */
    notifyConfigChange: (config: Record<string, unknown>): void => {
      for (const plugin of registeredPlugins.values()) {
        plugin.hooks?.onConfigChange?.({ config, auth: authState })
      }
    },

    /**
     * Get the read-only accessor for the global authentication state.
     *
     * Plugin view components can call this (via `usePluginManager`) to read stored secrets and the
     * selected security schemes. Returns an empty auth state when no accessor was provided.
     */
    getAuthState: (): PluginAuthState => authState,

    /**
     * Notify all plugins that the API Reference is being destroyed
     */
    notifyDestroy: (): void => {
      for (const plugin of registeredPlugins.values()) {
        plugin.hooks?.onDestroy?.()
      }
    },

    /**
     * Get all client plugins provided by registered plugins
     */
    getApiClientPlugins: (): ClientPlugin[] => {
      const apiClientPlugins: ClientPlugin[] = []

      for (const plugin of registeredPlugins.values()) {
        if (plugin.apiClientPlugins) {
          apiClientPlugins.push(...(plugin.apiClientPlugins as ClientPlugin[]))
        }
      }

      return apiClientPlugins
    },

    /**
     * Get all sidebar entries contributed by plugin views.
     *
     * Only views that opt in via `sidebar.show` are returned. Each entry's `id` matches the
     * id of the rendered component (see `getViewComponents`), so the API Reference can add it
     * to the sidebar navigation and scrolling/active-tracking work out of the box.
     */
    getSidebarEntries: (documentSlug: string): PluginSidebarEntry[] => {
      const entries: PluginSidebarEntry[] = []

      for (const plugin of registeredPlugins.values()) {
        for (const viewName of PLUGIN_VIEW_NAMES) {
          const viewComponents = plugin.views?.[viewName]
          viewComponents?.forEach((component: ViewComponent, index: number) => {
            if (component.sidebar?.show && component.sidebar.label) {
              entries.push({
                id: getPluginViewId(documentSlug, plugin.name, viewName, index),
                label: component.sidebar.label,
                viewName,
              })
            }
          })
        }
      }

      return entries
    },
  }
}

export type PluginManager = ReturnType<typeof createPluginManager>
