import { describe, expect, test } from 'vitest'

import { fetchSpecFromUrl } from './fetch-spec'

describe('Fetches specs correctly', () => {
  test('Fetches without a proxy', async () => {
    const spec = await fetchSpecFromUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  })

  test('Fetches with a proxy', async () => {
    const spec = await fetchSpecFromUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
      'https://api.scalar.com/request-proxy',
    )

    expect(typeof spec).toEqual('string')
    expect(spec.length).toBeGreaterThan(100)
  })
})
