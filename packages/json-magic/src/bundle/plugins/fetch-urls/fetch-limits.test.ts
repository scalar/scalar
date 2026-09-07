import { describe, expect, it, vi } from 'vitest'

import { bundle } from '@/bundle'
import { parseJson } from '@/bundle/plugins/parse-json'

import { fetchUrls } from './index'

describe('fetch-limits', () => {
  it('bounds transitive references with one budget per plugin', async () => {
    const fetch = vi.fn((input: string | URL | Request): Promise<Response> => {
      const url = String(input)
      const index = Number(url.split('/').at(-1))
      return Promise.resolve(new Response(JSON.stringify({ next: { $ref: `https://example.com/${index + 1}` } })))
    })
    await bundle(
      { next: { $ref: 'https://example.com/0' } },
      {
        treeShake: false,
        plugins: [parseJson(), fetchUrls({ fetch, limits: { maxRequests: 3 } })],
      },
    )
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('keeps unguarded callers unlimited unless limits are requested', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('{"ok":true}')))
    const plugin = fetchUrls({ fetch })
    await plugin.exec('https://example.com/one')
    await plugin.exec('https://example.com/two')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[0]).toStrictEqual(['https://example.com/one', { headers: undefined }])
  })

  it('shares aggregate byte accounting between concurrent loads', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('{"ok":true}')))
    const plugin = fetchUrls({ fetch, limits: { maxTotalBytes: 15 } })
    const results = await Promise.all([plugin.exec('https://example.com/one'), plugin.exec('https://example.com/two')])
    expect(results.filter((result) => result.ok).length).toBeLessThan(2)
    expect(await plugin.exec('https://example.com/three')).toStrictEqual({ ok: false })
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
