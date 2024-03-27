import { describe, expect, test } from 'vitest'

import { fetchSpecFromUrl } from './fetch-spec'

describe('Fetches specs correctly', () => {
  test('Fetches without a proxy', async () => {
    const spec = await fetchSpecFromUrl(
      'https://petstore3.swagger.io/api/v3/openapi.json',
    )

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  }, 20000)

  test('Fetches with a proxy', async () => {
    const spec = await fetchSpecFromUrl(
      'https://petstore3.swagger.io/api/v3/openapi.json',
      // TODO this worker url is just until we setup the real proxy.scalar.com url
      'https://proxy-server.amrit-150.workers.dev/',
      // 'https://proxy.scalar.com'
    )

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  }, 20000)
})
