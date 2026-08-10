import { describe, expect, it, vi } from 'vitest'

import { scalarRouteIntegration } from './integration'

const VIRTUAL_ID = 'virtual:scalar-starlight'
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`

/** Run the integration's `astro:config:setup` hook and capture what it did. */
const runSetup = (integration: ReturnType<typeof scalarRouteIntegration>) => {
  const injectRoute = vi.fn()
  const updateConfig = vi.fn()

  const hook = integration.hooks['astro:config:setup']
  if (typeof hook !== 'function') {
    throw new Error('Expected an astro:config:setup hook')
  }

  hook({ injectRoute, updateConfig } as unknown as Parameters<typeof hook>[0])

  const plugin = updateConfig.mock.calls[0]?.[0]?.vite?.plugins?.[0]

  return { injectRoute, plugin }
}

/** Resolve and load the virtual module through a captured Vite plugin. */
const loadReferences = (plugin: { resolveId: (id: string) => unknown; load: (id: string) => unknown }) => {
  expect(plugin.resolveId(VIRTUAL_ID)).toBe(RESOLVED_VIRTUAL_ID)
  expect(plugin.resolveId('some-other-module')).toBeUndefined()

  const module = plugin.load(RESOLVED_VIRTUAL_ID) as string
  return JSON.parse(module.replace(/^export const references = /, ''))
}

describe('scalarRouteIntegration', () => {
  it('names the integration per pathname and injects its route', () => {
    const integration = scalarRouteIntegration({ pathname: '/one', title: 'One', configuration: { url: '/one.json' } })
    expect(integration.name).toBe('@scalar/starlight:/one')

    const { injectRoute } = runSetup(integration)
    expect(injectRoute).toHaveBeenCalledWith(
      expect.objectContaining({ pattern: '/one', entrypoint: expect.stringContaining('ScalarReference.astro') }),
    )
  })

  it('serializes every registered reference into the virtual module', () => {
    const a = scalarRouteIntegration({ pathname: '/docs/a', title: 'A', configuration: { url: '/a.json' } })
    const b = scalarRouteIntegration({ pathname: '/docs/b', title: 'B', configuration: { url: '/b.json' } })

    const { plugin } = runSetup(b)
    const references = loadReferences(plugin)

    // The registry is shared across instances, so a single virtual module carries
    // every reference keyed by its pathname — this is what lets one site expose
    // several references at once.
    expect(references['/docs/a']).toEqual({ title: 'A', configuration: { url: '/a.json' } })
    expect(references['/docs/b']).toEqual({ title: 'B', configuration: { url: '/b.json' } })

    // Distinct names keep Astro from treating the two as the same integration.
    expect(a.name).not.toBe(b.name)
  })
})
