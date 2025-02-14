import { describe, expect, it } from 'vitest'

import { javascript } from './honoApiReference'

describe('javascript', () => {
  const url = 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml'

  it('renders the given spec URL', () => {
    expect(javascript({ spec: { url } }).toString()).toContain(
      `https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml`,
    )
  })

  it('renders the given spec URL with custom cdn', () => {
    expect(
      javascript({
        spec: {
          url,
        },
      }).toString(),
    ).toContain(`https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml`)
  })

  it('uses a custom CDN', () => {
    expect(
      javascript({
        spec: {
          url,
        },
        cdn: 'https://custom.example.com/cdn/@scalar/galaxy',
      }).toString(),
    ).toContain('script src="https://custom.example.com/cdn/@scalar/galaxy"')
  })

  it('pins the CDN to a specified version', () => {
    expect(
      javascript({
        spec: {
          url,
        },
        cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.0',
      }).toString(),
    ).toContain(
      'script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.0"',
    )
  })
})
