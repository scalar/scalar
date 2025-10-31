// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { fetchDocument } from './fetch-document'

const PROXY_PORT = 5051

beforeAll(async () => {
  // Check whether the proxy-server is running
  try {
    const result = await fetch(`http://127.0.0.1:${PROXY_PORT}`)

    if (result.ok) {
      return
    }
  } catch (_error) {
    throw new Error(`

[sendRequest.test.ts] Looks like you're not running @scalar/proxy-server on <http://127.0.0.1:${PROXY_PORT}>, but it's required for this test file.

Try to run it like this:

$ pnpm dev:proxy-server
`)
  }
})

const globalFetchSpy = vi.spyOn(global, 'fetch')
afterEach(() => {
  globalFetchSpy.mockReset()
})

describe('fetchDocument', () => {
  it('fetches specifications (without a proxy)', async () => {
    const spec = await fetchDocument('https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml')

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  })

  it('fetches specifications (through proxy.scalar.com)', async () => {
    const spec = await fetchDocument(
      'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
      'https://proxy.scalar.com',
    )

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  })

  it(`fetches specifications (through 127.0.0.1:${PROXY_PORT})`, async () => {
    const spec = await fetchDocument(
      'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
      `http://127.0.0.1:${PROXY_PORT}`,
    )

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  })

  it('fetches specifications from localhost without proxy', async () => {
    globalFetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    } as Response)

    const spec = await fetchDocument(`http://127.0.0.1:${PROXY_PORT}/test`)

    expect(typeof spec).toEqual('string')
  })

  it('throws error for invalid URLs', async () => {
    await expect(fetchDocument('not-a-valid-url')).rejects.toThrow()
  })

  it('throws error when fetch fails', async () => {
    await expect(fetchDocument('https://does-not-exist.scalar.com/spec.yaml')).rejects.toThrow('fetch failed')
  })

  it('uses custom fetch implementation', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('custom-fetch', { status: 200 }))

    const spec = await fetchDocument('https://example.com/spec.yaml', undefined, fetcher)

    expect(fetcher).toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledWith('https://example.com/spec.yaml', undefined)
    expect(spec).toEqual('custom-fetch')
  })
})
