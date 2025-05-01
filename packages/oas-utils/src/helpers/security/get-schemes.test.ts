import { securitySchemeSchema, type SecurityScheme } from '@scalar/types/entities'
import { describe, it, expect } from 'vitest'

import { getSchemes } from './get-schemes'
import type { Operation } from '@/entities/spec/operation'

describe('getSchemes', () => {
  // Setup some mock security schemes for testing
  const mockSecuritySchemes: Record<string, SecurityScheme> = {
    'auth1-uid': securitySchemeSchema.parse({
      uid: 'auth1-uid',
      type: 'http',
      scheme: 'bearer',
    }),
    'auth2-uid': securitySchemeSchema.parse({
      uid: 'auth2-uid',
      type: 'apiKey',
      in: 'header',
    }),
    'auth3-uid': securitySchemeSchema.parse({
      uid: 'auth3-uid',
      type: 'oauth2',
      flows: {},
    }),
  }

  it('should return empty array for empty input', () => {
    const result = getSchemes([], mockSecuritySchemes)
    expect(result).toEqual([])
  })

  it('should handle single-level array of UIDs', () => {
    const result = getSchemes(
      ['auth1-uid', 'auth2-uid'] as Operation['selectedSecuritySchemeUids'],
      mockSecuritySchemes,
    )
    expect(result).toHaveLength(2)
    expect(result).toEqual([mockSecuritySchemes['auth1-uid'], mockSecuritySchemes['auth2-uid']])
  })

  it('should handle nested arrays of UIDs', () => {
    const result = getSchemes(
      [['auth1-uid'], ['auth2-uid', 'auth3-uid']] as Operation['selectedSecuritySchemeUids'],
      mockSecuritySchemes,
    )
    expect(result).toHaveLength(3)
    expect(result).toEqual([
      mockSecuritySchemes['auth1-uid'],
      mockSecuritySchemes['auth2-uid'],
      mockSecuritySchemes['auth3-uid'],
    ])
  })

  it('should deduplicate UIDs', () => {
    const result = getSchemes(
      [
        ['auth1-uid', 'auth1-uid'],
        ['auth1-uid', 'auth2-uid'],
      ] as Operation['selectedSecuritySchemeUids'],
      mockSecuritySchemes,
    )
    expect(result).toHaveLength(2)
    expect(result).toEqual([mockSecuritySchemes['auth1-uid'], mockSecuritySchemes['auth2-uid']])
  })

  it('should filter out undefined schemes', () => {
    const result = getSchemes(
      ['auth1-uid', 'nonexistent-uid', 'auth2-uid'] as Operation['selectedSecuritySchemeUids'],
      mockSecuritySchemes,
    )
    expect(result).toHaveLength(2)
    expect(result).toEqual([mockSecuritySchemes['auth1-uid'], mockSecuritySchemes['auth2-uid']])
  })

  it('should handle empty nested arrays', () => {
    const result = getSchemes([[], ['auth1-uid'], []] as Operation['selectedSecuritySchemeUids'], mockSecuritySchemes)
    expect(result).toHaveLength(1)
    expect(result).toEqual([mockSecuritySchemes['auth1-uid']])
  })
})
