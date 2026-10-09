import { describe, expect, it } from 'vitest'

import { snippetz } from './snippetz'

describe('snippetz', () => {
  it.each(snippetz().plugins())('uses raw query data in $target/$client', ({ target, client }) => {
    const mapClients = new Set([
      'clojure/clj_http',
      'js/axios',
      'js/ofetch',
      'julia/http',
      'node/axios',
      'node/ofetch',
      'php/guzzle',
      'python/requests',
      'python/aiohttp',
      'python/httpx_sync',
      'python/httpx_async',
      'r/httr2',
    ])
    const value = '2026-09-30T02:00:00Z/%2F'
    const snippet = snippetz()
      .findPlugin(target, client)
      ?.generate({
        method: 'GET',
        url: 'https://example.com/events',
        queryString: [{ name: 'since', value }],
      })
    expect(snippet).toContain(mapClients.has(`${target}/${client}`) ? value : encodeURIComponent(value))
  })

  it('returns code for undici', () => {
    const snippet = snippetz().print('node', 'undici', {
      url: 'https://example.com',
    })

    expect(snippet).toMatchInlineSnapshot(`
      "import { request } from 'undici'

      const { statusCode, body } = await request('https://example.com')"
    `)
  })

  it('loads some clients by default', () => {
    expect(snippetz().clients()).toEqual(
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
        {
          key: 'python',
          title: 'Python',
          default: 'python3',
          clients: expect.arrayContaining([
            expect.objectContaining({
              client: 'aiohttp',
            }),
            expect.objectContaining({
              client: 'requests',
            }),
          ]),
        },
      ]),
    )
  })
})

describe('plugins', () => {
  it('returns true if it has the plugin', () => {
    const result = snippetz().plugins()

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
    const result = snippetz().hasPlugin('node', 'undici')

    expect(result).toBe(true)
  })

  it("returns false if it doesn't know the plugin", () => {
    const result = snippetz().hasPlugin('node', 'fantasy')

    expect(result).toBe(false)
  })
})
