import { describe, expect, it, vi } from 'vitest'

import { createExternalExampleResolver } from './external-examples'

describe('external-examples', () => {
  it('loads only on demand, deduplicates concurrent consumers, and caches successes', async () => {
    const fetch = vi.fn(async () => new Response('{"shippingType":"standard"}'))
    const resolver = createExternalExampleResolver({ fetch, origin: 'https://example.com/docs/openapi.json' })
    const example = { externalValue: '../examples/standard.json' }
    const state = resolver(example)
    expect(state.status).toBe('idle')
    expect(fetch.mock.calls.length).toBe(0)
    const other = resolver({ externalValue: 'https://example.com/examples/standard.json' })
    expect(other).toBe(state)
    await Promise.all([state.load(), other.load()])
    expect(state.status).toBe('loaded')
    expect(state.value).toEqual({ shippingType: 'standard' })
    await state.load()
    expect(fetch.mock.calls.length).toBe(1)
    expect(example).toEqual({ externalValue: '../examples/standard.json' })
  })

  it.each([null, false, 0, ''])('preserves an inline value of %j without fetching', async (value) => {
    const fetch = vi.fn()
    const resolver = createExternalExampleResolver({ fetch })
    const state = resolver({ externalValue: 'https://example.com/example', value })
    await state.load()
    expect(state.value).toBe(value)
    expect(fetch.mock.calls.length).toBe(0)
  })

  it.each([null, false, 0, ''])('preserves a downloaded JSON value of %j', async (value) => {
    const resolver = createExternalExampleResolver({ fetch: async () => new Response(JSON.stringify(value)) })
    const state = resolver({ externalValue: 'https://example.com/example' })
    await state.load()
    expect(state.status).toBe('loaded')
    expect(state.value).toBe(value)
  })

  it('allows an explicit retry after a failed download', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new Response('name: Kitty'))
    const resolver = createExternalExampleResolver({ fetch })
    const state = resolver({ externalValue: 'https://example.com/example' })
    await state.load()
    expect(state.status).toBe('error')
    expect(fetch.mock.calls.length).toBe(1)
    await state.load()
    expect(state.status).toBe('loaded')
    expect(state.value).toEqual({ name: 'Kitty' })
  })

  it('caps concurrent downloads at ten', async () => {
    const releases: (() => void)[] = []
    const fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          releases.push(() => resolve(new Response('{}')))
        }),
    )
    const resolver = createExternalExampleResolver({ fetch })
    const requests = Array.from({ length: 12 }, (_, index) =>
      resolver({ externalValue: `https://example.com/${index}` }).load(),
    )
    await vi.waitFor(() => expect(fetch.mock.calls.length).toBe(10))
    releases.splice(0).forEach((release) => release())
    await vi.waitFor(() => expect(fetch.mock.calls.length).toBe(12))
    releases.splice(0).forEach((release) => release())
    await Promise.all(requests)
  })
})
