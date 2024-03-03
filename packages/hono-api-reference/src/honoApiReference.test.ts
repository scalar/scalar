import { describe, expect, it } from 'vitest'

import { javascript } from './honoApiReference'

describe('javascript', () => {
  const url = 'https://petstore3.swagger.io/api/v3/openapi.json'

  it('renders the given spec URL', () => {
    expect(javascript({ spec: { url } }).toString()).toContain(
      `https://petstore3.swagger.io/api/v3/openapi.json`,
    )
  })

  it('renders the given spec URL with custom cdn', () => {
    expect(
      javascript({
        spec: {
          url,
          cdn: 'https://fastly.jsdelivr.net/npm/@scalar/api-reference',
        },
      }).toString(),
    ).toContain(`https://petstore3.swagger.io/api/v3/openapi.json`)
  })
})
