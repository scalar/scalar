import { describe, expect, it } from 'vitest'

import { plugins } from './clients'
import { plugins as lazyPlugins } from './clients/lazy'
import { snippetz } from './snippetz'

describe('snippetz', () => {
  it('generates code for undici with all plugins', async () => {
    const snippet = await snippetz(plugins).print('node', 'undici', {
      url: 'https://example.com',
    })

    expect(snippet).toMatchInlineSnapshot(`
      "import { request } from 'undici'

      const { statusCode, body } = await request('https://example.com')"
    `)
  })

  it('generates code with a subset of plugins', async () => {
    const { shellCurl } = await import('./plugins/shell/curl')
    const { nodeUndici } = await import('./plugins/node/undici')

    const s = snippetz([shellCurl, nodeUndici])

    const snippet = await s.print('shell', 'curl', {
      url: 'https://example.com',
    })

    expect(snippet).toContain('curl')
    expect(snippet).toContain('https://example.com')
  })

  it('returns undefined for unregistered plugins', async () => {
    const { shellCurl } = await import('./plugins/shell/curl')
    const s = snippetz([shellCurl])

    const result = await s.print('node', 'undici', {
      url: 'https://example.com',
    })

    expect(result).toBeUndefined()
  })

  it('builds clients list from registered plugins', () => {
    expect(snippetz(plugins).clients()).toEqual(
      expect.arrayContaining([
        {
          key: 'node',
          title: 'Node.js',
          default: 'fetch',
          clients: expect.arrayContaining([
            expect.objectContaining({
              client: 'undici',
            }),
            expect.objectContaining({
              client: 'fetch',
            }),
          ]),
        },
        {
          key: 'shell',
          title: 'Shell',
          default: 'curl',
          clients: expect.arrayContaining([
            expect.objectContaining({
              client: 'curl',
            }),
            expect.objectContaining({
              client: 'wget',
            }),
            expect.objectContaining({
              client: 'httpie',
            }),
          ]),
        },
      ]),
    )
  })

  it('only shows registered plugins in clients()', async () => {
    const { shellCurl } = await import('./plugins/shell/curl')
    const s = snippetz([shellCurl])

    const targets = s.clients()
    expect(targets).toHaveLength(1)
    expect(targets[0]?.key).toBe('shell')
    expect(targets[0]?.clients).toHaveLength(1)
  })
})

describe('plugins', () => {
  it('returns all registered plugin identifiers', () => {
    const result = snippetz(plugins).plugins()

    expect(result).toEqual(
      expect.arrayContaining([
        {
          target: 'node',
          client: 'undici',
        },
        {
          target: 'node',
          client: 'fetch',
        },
        {
          target: 'shell',
          client: 'curl',
        },
      ]),
    )
  })
})

describe('hasPlugin', () => {
  it('returns true if it has the plugin', () => {
    const result = snippetz(plugins).hasPlugin('node', 'undici')

    expect(result).toBe(true)
  })

  it('returns false if it does not know the plugin', () => {
    const result = snippetz(plugins).hasPlugin('node', 'fantasy')

    expect(result).toBe(false)
  })
})

describe('lazy plugins', () => {
  it('generates code on demand via lazy plugins', async () => {
    const s = snippetz(lazyPlugins)

    const snippet = await s.print('shell', 'curl', {
      url: 'https://example.com',
    })

    expect(snippet).toContain('curl')
    expect(snippet).toContain('https://example.com')
  })

  it('provides clients metadata immediately', () => {
    const s = snippetz(lazyPlugins)
    const targets = s.clients()

    expect(targets.length).toBeGreaterThan(0)
    expect(targets.find((t) => t.key === 'shell')).toBeDefined()
    expect(targets.find((t) => t.key === 'node')).toBeDefined()
  })
})
