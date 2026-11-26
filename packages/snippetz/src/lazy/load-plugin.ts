import type { ClientId, HarRequest, Plugin, TargetId } from '@scalar/types/snippetz'

import { pluginLoaders } from './plugin-loaders'

/** Loads the plugin for a single `target/client` id. */
type PluginLoader = () => Promise<Plugin>

/** The lazy loading API, bound to one set of loaders. */
type LazyPlugins = {
  loadPlugin: <T extends TargetId>(target: T | string, client: ClientId<T> | string) => Promise<Plugin | undefined>
  getLoadedPlugin: <T extends TargetId>(target: T | string, client: ClientId<T> | string) => Plugin | undefined
  hasPlugin: <T extends TargetId>(target: T | string, client: ClientId<T> | string) => boolean
  preloadClients: (clientIds: readonly string[]) => Promise<void>
  print: <T extends TargetId>(
    target: T,
    client: ClientId<T>,
    request: Partial<HarRequest>,
  ) => Promise<string | undefined>
}

/**
 * Create a plugin cache around a map of loaders.
 *
 * The cache lives in module scope so every caller (and every component instance) shares the same loaded
 * generators. Separate from the default instance so tests can pass loaders they control.
 */
export const createLazyPlugins = (loaders: Partial<Record<string, PluginLoader>>): LazyPlugins => {
  const loaded = new Map<string, Plugin>()
  const pending = new Map<string, Promise<Plugin>>()

  const getLoader = (id: string): PluginLoader | undefined => (Object.hasOwn(loaders, id) ? loaders[id] : undefined)

  const getLoadedPlugin: LazyPlugins['getLoadedPlugin'] = (target, client) => loaded.get(`${target}/${client}`)

  const hasPlugin: LazyPlugins['hasPlugin'] = (target, client) => Boolean(getLoader(`${target}/${client}`))

  const loadPlugin: LazyPlugins['loadPlugin'] = (target, client) => {
    const id = `${target}/${client}`

    const plugin = loaded.get(id)
    if (plugin) {
      return Promise.resolve(plugin)
    }

    const loader = getLoader(id)
    if (!loader) {
      return Promise.resolve(undefined)
    }

    // Share the in-flight request, so concurrent callers trigger a single import
    const inFlight = pending.get(id)
    if (inFlight) {
      return inFlight
    }

    const request = loader().then(
      (result) => {
        loaded.set(id, result)
        pending.delete(id)
        return result
      },
      (error: unknown) => {
        // Forget the failed attempt, so the next call tries again (for example after a network hiccup)
        pending.delete(id)
        throw error
      },
    )
    pending.set(id, request)

    return request
  }

  const preloadClients: LazyPlugins['preloadClients'] = (clientIds) =>
    // Settled rather than `all`: a host awaits this before mounting, so one generator that fails to
    // load must neither reject nor cut the wait short for the others. It loads again on next use.
    Promise.allSettled(
      clientIds.flatMap((clientId) => {
        // Custom code samples and unknown ids have nothing to load
        if (!getLoader(clientId)) {
          return []
        }
        const [target = '', client = ''] = clientId.split('/')
        return [loadPlugin(target, client)]
      }),
    ).then(() => undefined)

  const print: LazyPlugins['print'] = (target, client, request) =>
    loadPlugin(target, client).then((plugin) => plugin?.generate(request))

  return { loadPlugin, getLoadedPlugin, hasPlugin, preloadClients, print }
}

const lazyPlugins = createLazyPlugins(pluginLoaders)

/**
 * Load the plugin for a target and client on demand.
 *
 * Every plugin is a separate chunk. Concurrent calls share one import, a failed import is retried on the
 * next call, and an already loaded plugin resolves right away. Resolves `undefined` for unknown clients.
 *
 * @example
 * ```ts
 * const plugin = await loadPlugin('node', 'undici')
 * plugin?.generate({ url: 'https://example.com' })
 * ```
 */
export const loadPlugin = lazyPlugins.loadPlugin

/**
 * Synchronously return a plugin that has already been loaded with `loadPlugin` or `preloadClients`.
 *
 * Returns `undefined` while the plugin has not been loaded yet (or for unknown clients).
 */
export const getLoadedPlugin = lazyPlugins.getLoadedPlugin

/**
 * Check whether a built-in plugin exists for a target and client, without loading it.
 */
export const hasPlugin = lazyPlugins.hasPlugin

/**
 * Load the plugins for a list of `target/client` ids (for example `['shell/curl', 'node/fetch']`).
 *
 * Await this before rendering or hydrating, so the first render can generate snippets synchronously.
 * Ids that do not belong to a built-in client (such as custom code samples) are ignored. It never
 * rejects: a client whose generator fails to load stays unloaded, and loads again on its next use.
 */
export const preloadClients = lazyPlugins.preloadClients

/**
 * Load the plugin for a target and client, then generate the code example.
 *
 * Resolves `undefined` when there is no such client, like `snippetz().print()`.
 *
 * @example
 * ```ts
 * const snippet = await print('node', 'undici', { url: 'https://example.com' })
 * ```
 */
export const print = lazyPlugins.print
