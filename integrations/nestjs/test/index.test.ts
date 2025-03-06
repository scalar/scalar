import { describe, expect, it } from 'vitest'

import { ApiReference } from '../src'

describe('ApiReference', () => {
  const url = 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml'

  it('renders the given spec URL', () => {
    expect(ApiReference({ url }).toString()).toContain('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml')
  })

  it('renders the given spec URL with custom cdn', () => {
    expect(
      ApiReference({
        url,
        cdn: 'https://fastly.jsdelivr.net/npm/@scalar/api-reference',
      }).toString(),
    ).toContain('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml')
  })
})
