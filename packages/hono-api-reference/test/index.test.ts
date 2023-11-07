import { describe, expect, it } from 'vitest'

import { apiReference } from '../src'

describe('apiReference', () => {
  const url = 'https://petstore3.swagger.io/api/v3/openapi.json'

  it('renders the given spec URL', () => {
    expect(
      apiReference({ configuration: { spec: { url } } }).toString(),
    ).toContain(`https://petstore3.swagger.io/api/v3/openapi.json`)
  })
})
