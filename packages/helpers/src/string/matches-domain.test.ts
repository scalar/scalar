import { describe, expect, it } from 'vitest'

import { matchesDomain } from './matches-domain'

describe('matchesDomain', () => {
  it('should match the current host', () => {
    expect(matchesDomain('https://example.com', 'example.com')).toBe(true)
  })

  it('should match the current domain with a configured wildcard', () => {
    expect(matchesDomain('https://example.com', '.example.com')).toBe(true)
  })

  it('should not match the current host', () => {
    expect(matchesDomain('https://example.com', 'scalar.com')).toBe(false)
  })

  it('should match the subdomain with a configured wildcard', () => {
    expect(matchesDomain('https://void.scalar.com', '.scalar.com')).toBe(true)
  })

  it("shouldn't match the current host without a wildcard", () => {
    expect(matchesDomain('https://void.scalar.com', 'scalar.com')).toBe(false)
  })
})
