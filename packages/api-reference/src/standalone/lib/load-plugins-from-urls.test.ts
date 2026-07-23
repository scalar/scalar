import type { ApiReferencePlugin } from '@scalar/types/api-reference'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { hasPluginUrls, loadPluginsFromUrls } from './load-plugins-from-urls'

/** Create a `data:` URL for an ESM module that exports a minimal plugin factory as its default export */
const pluginModuleUrl = (name: string) =>
  `data:text/javascript,export default () => ({ name: '${name}', extensions: [] })`

const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

afterEach(() => {
  consoleErrorSpy.mockClear()
})

describe('hasPluginUrls', () => {
  it('returns false for configurations without plugin URLs', () => {
    expect(hasPluginUrls({})).toBe(false)
    expect(hasPluginUrls({ pluginUrls: [] })).toBe(false)
    expect(hasPluginUrls([{}, {}])).toBe(false)
  })

  it('returns true when a configuration references a plugin URL', () => {
    expect(hasPluginUrls({ pluginUrls: [pluginModuleUrl('example')] })).toBe(true)
    expect(hasPluginUrls([{}, { pluginUrls: [pluginModuleUrl('example')] }])).toBe(true)
  })
})

describe('loadPluginsFromUrls', () => {
  it('appends the default export of the module to the plugins of the configuration', async () => {
    const configuration = { pluginUrls: [pluginModuleUrl('loaded-plugin')] }

    await loadPluginsFromUrls(configuration)

    const plugins = (configuration as { plugins?: ApiReferencePlugin[] }).plugins
    expect(plugins).toHaveLength(1)
    expect(plugins?.[0]?.()).toMatchObject({ name: 'loaded-plugin' })
  })

  it('keeps plugins that were passed directly and appends the loaded ones', async () => {
    const directPlugin: ApiReferencePlugin = () => ({ name: 'direct-plugin', extensions: [] })
    const configuration = {
      plugins: [directPlugin],
      pluginUrls: [pluginModuleUrl('loaded-plugin')],
    }

    await loadPluginsFromUrls(configuration)

    expect(configuration.plugins).toHaveLength(2)
    expect(configuration.plugins[0]).toBe(directPlugin)
    expect(configuration.plugins[1]?.()).toMatchObject({ name: 'loaded-plugin' })
  })

  it('resolves plugin URLs for every configuration in a list', async () => {
    const sharedUrl = pluginModuleUrl('shared-plugin')
    const configurations = [{ pluginUrls: [sharedUrl] }, { pluginUrls: [sharedUrl] }, {}]

    await loadPluginsFromUrls(configurations)

    expect((configurations[0] as { plugins?: ApiReferencePlugin[] }).plugins).toHaveLength(1)
    expect((configurations[1] as { plugins?: ApiReferencePlugin[] }).plugins).toHaveLength(1)
    expect((configurations[2] as { plugins?: ApiReferencePlugin[] }).plugins).toBeUndefined()
  })

  it('skips modules that do not export a function as their default export', async () => {
    const configuration = { pluginUrls: ['data:text/javascript,export default 42'] }

    await loadPluginsFromUrls(configuration)

    expect((configuration as { plugins?: ApiReferencePlugin[] }).plugins).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('does not export an API Reference plugin'))
  })

  it('logs failed imports and still loads the remaining plugins', async () => {
    const configuration = {
      pluginUrls: ['data:text/javascript,this is not valid javascript(', pluginModuleUrl('working-plugin')],
    }

    await loadPluginsFromUrls(configuration)

    const plugins = (configuration as { plugins?: ApiReferencePlugin[] }).plugins
    expect(plugins).toHaveLength(1)
    expect(plugins?.[0]?.()).toMatchObject({ name: 'working-plugin' })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load the plugin module'),
      expect.anything(),
    )
  })
})
