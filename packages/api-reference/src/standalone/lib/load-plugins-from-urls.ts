import type { AnyApiReferenceConfiguration, ApiReferencePlugin } from '@scalar/types/api-reference'

/**
 * Import a plugin module with a browser-native dynamic `import()`.
 *
 * The specifier is fully dynamic, so bundlers can't analyze it and leave the `import()` call
 * as-is in the output (including the UMD standalone bundle) — the `@vite-ignore` comment just
 * silences the warning about that.
 */
const importModule = (url: string): Promise<Record<string, unknown>> => import(/* @vite-ignore */ url)

/**
 * Load a single plugin module and return its default export.
 *
 * Failures (network errors, modules without a function default export) are logged and swallowed
 * so a broken plugin URL never prevents the API reference itself from mounting.
 */
const loadPluginFromUrl = async (url: string): Promise<ApiReferencePlugin | undefined> => {
  try {
    const pluginModule = await importModule(url)
    const plugin = pluginModule?.default

    if (typeof plugin !== 'function') {
      console.error(
        `[@scalar/api-reference] The module at ${url} does not export an API Reference plugin as its default export.`,
      )
      return undefined
    }

    return plugin as ApiReferencePlugin
  } catch (error) {
    console.error(`[@scalar/api-reference] Failed to load the plugin module at ${url}:`, error)
    return undefined
  }
}

/** Normalize the configuration input to a list of configuration objects */
const getConfigurations = (configuration: AnyApiReferenceConfiguration) =>
  Array.isArray(configuration) ? configuration : [configuration]

/** Whether any of the passed configurations reference a plugin by URL */
export const hasPluginUrls = (configuration: AnyApiReferenceConfiguration): boolean =>
  getConfigurations(configuration).some((config) => Boolean(config.pluginUrls?.length))

/**
 * Resolve the `pluginUrls` of all passed configurations and append the loaded plugins to the
 * respective configuration's `plugins`.
 *
 * Plugin registration is not reactive — plugins are read once when the API reference renders for
 * the first time — so this must complete before the app is mounted. Each URL is imported only
 * once, even when multiple configurations reference it.
 */
export const loadPluginsFromUrls = async (configuration: AnyApiReferenceConfiguration): Promise<void> => {
  const pendingImports = new Map<string, Promise<ApiReferencePlugin | undefined>>()

  const importOnce = (url: string) => {
    const pending = pendingImports.get(url) ?? loadPluginFromUrl(url)
    pendingImports.set(url, pending)
    return pending
  }

  await Promise.all(
    getConfigurations(configuration).map(async (config) => {
      if (!config.pluginUrls?.length) {
        return
      }

      const loadedPlugins = await Promise.all(config.pluginUrls.map(importOnce))
      const plugins = loadedPlugins.filter((plugin): plugin is ApiReferencePlugin => plugin !== undefined)

      if (plugins.length) {
        config.plugins = [...(config.plugins ?? []), ...plugins]
      }
    }),
  )
}
