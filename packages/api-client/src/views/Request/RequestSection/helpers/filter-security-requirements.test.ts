import { securitySchemeSchema, type Collection } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { filterSecurityRequirements } from './filter-security-requirements'

describe('filterSecurityRequirements', () => {
  // Mock security schemes for testing
  const mockSecuritySchemes = {
    bearerAuthUid: securitySchemeSchema.parse({
      uid: 'bearerAuthUid',
      type: 'http',
      scheme: 'bearer',
      nameKey: 'bearerAuth',
    }),
    apiKeyUid: securitySchemeSchema.parse({
      uid: 'apiKeyUid',
      type: 'apiKey',
      name: 'api-key',
      in: 'header',
      nameKey: 'apiKey',
    }),
    oauthUid: securitySchemeSchema.parse({
      uid: 'oauthUid',
      type: 'oauth2',
      flows: {
        authorizationCode: {
          type: 'authorizationCode',
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            read: 'Read access',
          },
        },
      },
      nameKey: 'oauth',
    }),
  } as const

  it('should return empty array when no security requirements exist', () => {
    const result = filterSecurityRequirements([], [mockSecuritySchemes.bearerAuthUid.uid], mockSecuritySchemes)
    expect(result).toEqual([])
  })

  it('should return empty array when there is only an optional security requirement', () => {
    const result = filterSecurityRequirements([{}], [mockSecuritySchemes.bearerAuthUid.uid], mockSecuritySchemes)
    expect(result).toEqual([])
  })

  it('should return empty array when no security schemes are selected', () => {
    const result = filterSecurityRequirements([{ bearerAuth: [] }], [], mockSecuritySchemes)
    expect(result).toEqual([])
  })

  it('should filter single security requirement correctly', () => {
    const result = filterSecurityRequirements(
      [{ bearerAuth: [] }],
      [mockSecuritySchemes.bearerAuthUid.uid],
      mockSecuritySchemes,
    )
    expect(result).toEqual([mockSecuritySchemes.bearerAuthUid])
  })

  it('should filter multiple security requirements correctly', () => {
    const result = filterSecurityRequirements(
      [{ bearerAuth: [] }, { apiKey: [] }, { oauth: [] }],
      [mockSecuritySchemes.apiKeyUid.uid, mockSecuritySchemes.bearerAuthUid.uid],
      mockSecuritySchemes,
    )
    expect(result).toEqual([mockSecuritySchemes.apiKeyUid, mockSecuritySchemes.bearerAuthUid])
  })

  it('should filter multiple security requirements correctly (reversed)', () => {
    const result = filterSecurityRequirements(
      [{ bearerAuth: [] }, { apiKey: [] }],
      [mockSecuritySchemes.apiKeyUid.uid, mockSecuritySchemes.bearerAuthUid.uid, mockSecuritySchemes.oauthUid.uid],
      mockSecuritySchemes,
    )
    expect(result).toEqual([mockSecuritySchemes.apiKeyUid, mockSecuritySchemes.bearerAuthUid])
  })

  it('should handle complex security requirements', () => {
    const result = filterSecurityRequirements(
      [{ bearerAuth: [], apiKey: [] }],
      [[mockSecuritySchemes.bearerAuthUid.uid, mockSecuritySchemes.apiKeyUid.uid]],
      mockSecuritySchemes,
    )

    expect(result).toEqual([mockSecuritySchemes.bearerAuthUid, mockSecuritySchemes.apiKeyUid])
  })

  it('should return empty array for non-matching security schemes', () => {
    const result = filterSecurityRequirements(
      [{ differentAuth: [] }],
      ['auth1'] as Collection['selectedSecuritySchemeUids'],
      mockSecuritySchemes,
    )
    expect(result).toEqual([])
  })
})
