import { describe, expect, it } from 'vitest'

import { detectVersion } from './detect-version'

describe('detect-version', () => {
  it('detects a Swagger 2.0 document', () => {
    expect(detectVersion({ swagger: '2.0' })).toBe('2.0')
  })

  it('detects OpenAPI 3.0, 3.1, and 3.2 from the patch version', () => {
    expect(detectVersion({ openapi: '3.0.4' })).toBe('3.0')
    expect(detectVersion({ openapi: '3.1.0' })).toBe('3.1')
    expect(detectVersion({ openapi: '3.2.0' })).toBe('3.2')
  })

  it('does not mistake a future 3.10.x for 3.1', () => {
    // `startsWith('3.1')` used to match "3.10.0"; a major.minor compare must not.
    expect(detectVersion({ openapi: '3.10.0' })).toBeUndefined()
    expect(detectVersion({ openapi: '3.11' })).toBeUndefined()
  })

  it('returns undefined for unsupported or non-string versions', () => {
    expect(detectVersion({ openapi: '4.0.0' })).toBeUndefined()
    expect(detectVersion({ openapi: 3.1 })).toBeUndefined()
    expect(detectVersion({})).toBeUndefined()
    expect(detectVersion(null)).toBeUndefined()
  })
})
