import type { ClientId, HarRequest, Plugin, PluginConfiguration, Target, TargetId } from '@scalar/types/snippetz'

/**
 * The return type of the snippetz() factory function.
 * Useful for passing a configured instance around without coupling to the plugin list.
 */
export type Snippetz = ReturnType<typeof snippetz>

/**
 * Create a code snippet generator from the given set of plugins.
 *
 * Consumers control what gets bundled by choosing which plugins to pass in:
 * - A hand-picked subset for minimal bundles
 * - `allPlugins` from `@scalar/snippetz/clients` for everything upfront
 * - `allPlugins` from `@scalar/snippetz/clients/lazy` for metadata-only with on-demand loading
 */
export function snippetz(plugins: Plugin[]) {
  function findPlugin<T extends TargetId>(target: T | string, client: ClientId<T> | string): Plugin | undefined {
    return plugins.find((p) => p.target === target && p.client === client)
  }

  return {
    /**
     * Generate a code snippet for the given target/client pair.
     * Returns a Promise because lazy plugins load their generator on demand.
     */
    async print<T extends TargetId>(
      target: T,
      client: ClientId<T>,
      request: Partial<HarRequest>,
      configuration?: PluginConfiguration,
    ): Promise<string | undefined> {
      const plugin = findPlugin(target, client)
      if (!plugin) {
        return undefined
      }
      return await plugin.generate(request, configuration)
    },

    /**
     * Build the grouped Target[] list dynamically from the registered plugins.
     * The first plugin registered for each target becomes the default client.
     */
    clients(): Target[] {
      const targetMap = new Map<
        string,
        { key: TargetId; title: string; defaultClient: ClientId<TargetId>; clients: Plugin[] }
      >()

      for (const plugin of plugins) {
        const existing = targetMap.get(plugin.target)
        if (existing) {
          existing.clients.push(plugin)
        } else {
          targetMap.set(plugin.target, {
            key: plugin.target,
            title: plugin.targetTitle,
            defaultClient: plugin.client,
            clients: [plugin],
          })
        }
      }

      return Array.from(targetMap.values()).map(({ key, title, defaultClient, clients }) => ({
        key,
        title,
        default: defaultClient,
        clients,
      })) as Target[]
    },

    /**
     * Returns a flat list of all registered plugin identifiers.
     */
    plugins(): Array<{ target: TargetId; client: ClientId<TargetId> }> {
      return plugins.map((p) => ({
        target: p.target,
        client: p.client,
      }))
    },

    findPlugin,

    hasPlugin<T extends TargetId>(target: T | string, client: ClientId<T> | string): boolean {
      return Boolean(findPlugin(target, client))
    },
  }
}
