import { describe, expect, it, vi } from 'vitest'

import { scalarStarlight } from './plugin'

/** Run the `config:setup` hook with spies and return what it did. */
const runConfigSetup = (
  plugin: ReturnType<typeof scalarStarlight>,
  config: { sidebar?: unknown[] } = { sidebar: [] },
) => {
  const updateConfig = vi.fn()
  const addIntegration = vi.fn()
  const logger = { warn: vi.fn() }

  const hook = plugin.hooks['config:setup']
  if (typeof hook !== 'function') {
    throw new Error('Expected a config:setup hook')
  }

  hook({ config, updateConfig, addIntegration, logger } as unknown as Parameters<typeof hook>[0])

  return { updateConfig, addIntegration, logger }
}

describe('scalarStarlight', () => {
  it('is a named Starlight plugin', () => {
    const plugin = scalarStarlight({ configuration: { url: '/openapi.json' } })

    expect(plugin.name).toBe('@scalar/starlight')
    expect(plugin.hooks['config:setup']).toBeTypeOf('function')
  })

  it('adds a sidebar entry and a route integration', () => {
    const plugin = scalarStarlight({ configuration: { url: '/openapi.json' } })
    const { updateConfig, addIntegration } = runConfigSetup(plugin)

    expect(addIntegration).toHaveBeenCalledOnce()
    expect(updateConfig).toHaveBeenCalledWith({
      sidebar: [{ label: 'API Reference', link: '/api-reference' }],
    })
  })

  it('keeps existing sidebar entries', () => {
    const plugin = scalarStarlight({ configuration: { url: '/openapi.json' } })
    const existing = { label: 'Guides', link: '/guides' }
    const { updateConfig } = runConfigSetup(plugin, { sidebar: [existing] })

    expect(updateConfig).toHaveBeenCalledWith({
      sidebar: [existing, { label: 'API Reference', link: '/api-reference' }],
    })
  })

  it('honors a custom pathname, label and title', () => {
    const plugin = scalarStarlight({
      configuration: { url: '/openapi.json' },
      pathname: 'reference/',
      label: 'My API',
    })
    const { updateConfig, addIntegration } = runConfigSetup(plugin)

    // The pathname is normalized to a single leading slash, no trailing slash.
    expect(updateConfig).toHaveBeenCalledWith({
      sidebar: [{ label: 'My API', link: '/reference' }],
    })

    const integration = addIntegration.mock.calls[0]?.[0]
    expect(integration?.name).toBe('@scalar/starlight')
  })

  it('leaves an auto-generated sidebar untouched', () => {
    // No `sidebar` in the config means Starlight auto-generates it. Appending an
    // entry would turn that into an explicit one-item sidebar and hide every
    // other page, so the plugin warns instead of touching it.
    const plugin = scalarStarlight({ configuration: { url: '/openapi.json' } })
    const { updateConfig, addIntegration, logger } = runConfigSetup(plugin, {})

    expect(addIntegration).toHaveBeenCalledOnce()
    expect(updateConfig).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledOnce()
  })

  it('normalizes messy pathnames', () => {
    const plugin = scalarStarlight({
      configuration: { url: '/openapi.json' },
      pathname: '//docs//api/',
    })
    const { updateConfig } = runConfigSetup(plugin)

    expect(updateConfig).toHaveBeenCalledWith({
      sidebar: [{ label: 'API Reference', link: '/docs/api' }],
    })
  })
})
