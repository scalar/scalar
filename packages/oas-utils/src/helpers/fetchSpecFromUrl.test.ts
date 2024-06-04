import { describe, expect, it } from 'vitest'

import { fetchSpecFromUrl } from './fetchSpecFromUrl'

const PROXY_PORT = 5051

describe('fetchSpecFromUrl', () => {
  it('fetches specifications (without a proxy)', async () => {
    const spec = await fetchSpecFromUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )

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
