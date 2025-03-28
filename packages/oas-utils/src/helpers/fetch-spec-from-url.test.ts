import { beforeAll, describe, expect, it } from 'vitest'

import { fetchSpecFromUrl } from './fetch-spec-from-url.ts'

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

[sendRequest.test.ts] Looks like you’re not running @scalar/proxy-server on <http://127.0.0.1:${PROXY_PORT}>, but it’s required for this test file.

Try to run it like this:

$ pnpm dev:proxy-server
`)
  }
})

describe('fetchSpecFromUrl', () => {
  it('fetches specifications (without a proxy)', async () => {
    const spec = await fetchSpecFromUrl('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml')

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  })

  it('fetches specifications (through proxy.scalar.com)', async () => {
    const spec = await fetchSpecFromUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
      'https://proxy.scalar.com',
    )

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  })

  it(`fetches specifications (through 127.0.0.1:${PROXY_PORT})`, async () => {
    const spec = await fetchSpecFromUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
      `http://127.0.0.1:${PROXY_PORT}`,
    )

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  })
})
