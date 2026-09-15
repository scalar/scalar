import { beforeEach, describe, expect, it, vi } from 'vitest'

import { scalarRouteIntegration } from './integration'
import { scalarStarlight } from './plugin'

// Stub the route integration so we can assert exactly what the plugin forwards
// to it (pathname, title, configuration) without running the real one, which
// mutates a module-scoped registry and would leak between tests.
vi.mock('./integration', () => ({
  scalarRouteIntegration: vi.fn((options: { pathname: string }) => ({
    name: `@scalar/starlight:${options.pathname}`,
    hooks: {},
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

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
      title: 'My API Reference',
    })
    const { updateConfig, addIntegration } = runConfigSetup(plugin)

    // The pathname is normalized to a single leading slash, no trailing slash.
    expect(updateConfig).toHaveBeenCalledWith({
      sidebar: [{ label: 'My API', link: '/reference' }],
    })

    // The custom title and normalized pathname are forwarded to the integration.
    expect(scalarRouteIntegration).toHaveBeenCalledWith({
      pathname: '/reference',
      title: 'My API Reference',
      configuration: { url: '/openapi.json' },
    })

    // The injected integration is named per pathname so multiple references do
    // not look like the same integration to Astro.
    const integration = addIntegration.mock.calls[0]?.[0]
    expect(integration?.name).toBe('@scalar/starlight:/reference')
  })

  it('defaults the page title to the label', () => {
    const plugin = scalarStarlight({ configuration: { url: '/openapi.json' }, label: 'My API' })
    runConfigSetup(plugin)

    expect(scalarRouteIntegration).toHaveBeenCalledWith(expect.objectContaining({ title: 'My API' }))
  })

  it('rejects a pathname that resolves to the site root', () => {
    expect(() => scalarStarlight({ configuration: { url: '/openapi.json' }, pathname: '/' })).toThrow(
      /must not resolve/,
    )
    expect(() => scalarStarlight({ configuration: { url: '/openapi.json' }, pathname: '///' })).toThrow(
      /must not resolve/,
    )
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
