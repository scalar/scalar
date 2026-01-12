import type { MergedSecuritySchemes } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type SecurityRequirementObject,
  type SecuritySchemeObject,
  SecuritySchemeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getDefaultScopes, getDefaultSecurity } from './get-default-security'

describe('getDefaultScopes', () => {
  it('returns empty array for non-oauth2 schemes', () => {
    const apiKeyScheme: SecuritySchemeObject = {
      type: 'apiKey',
      'x-scalar-secret-token': 'test-token',
      name: 'X-API-Key',
      in: 'header',
    }

    const result = getDefaultScopes(apiKeyScheme)
    expect(result).toEqual([])
  })

  it('returns empty array for undefined scheme', () => {
    const result = getDefaultScopes(undefined)
    expect(result).toEqual([])
  })

  it('returns x-default-scopes for oauth2 scheme', () => {
    const oauth2Scheme = coerceValue(SecuritySchemeObjectSchema, {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'Read user information',
            'write:users': 'Write user information',
          },
        },
      },
      'x-default-scopes': ['read:users', 'write:users'],
    })

    const result = getDefaultScopes(oauth2Scheme)
    expect(result).toEqual(['read:users', 'write:users'])
  })

  it('returns empty array for oauth2 scheme without x-default-scopes', () => {
    const oauth2Scheme = coerceValue(SecuritySchemeObjectSchema, {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'Read user information',
          },
        },
      },
    })

    const result = getDefaultScopes(oauth2Scheme)

    expect(result).toEqual([])
  })
})

describe('getDefaultSecurity', () => {
  it('returns null when no security requirements and no preferred scheme', () => {
    const securityRequirements: SecurityRequirementObject[] = []
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = undefined
    const securitySchemes: MergedSecuritySchemes = {}

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)
    expect(result).toBeNull()
  })

  it('returns preferred security scheme as string with empty scopes', () => {
    const securityRequirements: SecurityRequirementObject[] = []
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = 'apiKeyAuth'
    const securitySchemes: MergedSecuritySchemes = {
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'test-token',
      },
    }

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)
    expect(result).toEqual({ apiKeyAuth: [] })
  })

  it('returns preferred security scheme as array with default scopes for oauth2', () => {
    const securityRequirements: SecurityRequirementObject[] = []
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = ['oauth2Auth', 'apiKeyAuth']
    const securitySchemes: MergedSecuritySchemes = {
      oauth2Auth: coerceValue(SecuritySchemeObjectSchema, {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': 'Read user information',
              'write:users': 'Write user information',
            },
          },
        },
        'x-default-scopes': ['read:users'],
      }),
      apiKeyAuth: coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'test-token',
      }),
    }

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)
    expect(result).toEqual({
      oauth2Auth: ['read:users'],
      apiKeyAuth: [],
    })
  })

  it('handles nested array in preferred security scheme for complex auth', () => {
    const securityRequirements: SecurityRequirementObject[] = []
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = [
      ['oauth2Auth', 'apiKeyAuth'],
      'basicAuth',
    ]
    const securitySchemes: MergedSecuritySchemes = {
      oauth2Auth: coerceValue(SecuritySchemeObjectSchema, {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': 'Read user information',
              'write:users': 'Write user information',
            },
          },
        },
        'x-default-scopes': ['read:users', 'write:users'],
      }),
      apiKeyAuth: coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }),
      basicAuth: coerceValue(SecuritySchemeObjectSchema, {
        type: 'http',
        scheme: 'basic',
      }),
    }

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)
    expect(result).toEqual({
      oauth2Auth: ['read:users', 'write:users'],
      apiKeyAuth: [],
      basicAuth: [],
    })
  })

  it('falls back to first security requirement when no preferred scheme', () => {
    const securityRequirements: SecurityRequirementObject[] = [{ apiKeyAuth: [] }, { oauth2Auth: ['read:users'] }]
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = undefined
    const securitySchemes: MergedSecuritySchemes = {
      apiKeyAuth: coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }),
      oauth2Auth: coerceValue(SecuritySchemeObjectSchema, {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': 'Read user information',
            },
          },
        },
        'x-default-scopes': ['read:users'],
      }),
    }

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)

    expect(result).toEqual({ apiKeyAuth: [] })
  })

  it('handles security scheme with $ref-value wrapper', () => {
    const securityRequirements: SecurityRequirementObject[] = []
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = ['oauth2Auth']
    const securitySchemes: MergedSecuritySchemes = {
      oauth2Auth: {
        $ref: '#/components/securitySchemes/oauth2Auth',
        '$ref-value': coerceValue(SecuritySchemeObjectSchema, {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              refreshUrl: 'https://example.com/oauth/refresh',
              scopes: {
                'admin': 'Admin access',
              },
            },
          },
          'x-default-scopes': ['admin'],
        }),
      },
    }

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)

    expect(result).toEqual({
      oauth2Auth: ['admin'],
    })
  })

  it('handles empty security requirement object for anonymous access', () => {
    const securityRequirements: SecurityRequirementObject[] = [{}]
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = undefined
    const securitySchemes: MergedSecuritySchemes = {}

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)

    expect(result).toEqual({})
  })

  it('handles missing security scheme in preferred config gracefully', () => {
    const securityRequirements: SecurityRequirementObject[] = []
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = ['nonExistentAuth']
    const securitySchemes: MergedSecuritySchemes = {
      apiKeyAuth: coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'test-token',
      }),
    }

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)

    // Should return the preferred scheme with empty scopes even if it does not exist
    expect(result).toEqual({
      nonExistentAuth: [],
    })
  })

  it('handles multiple oauth2 schemes with different default scopes', () => {
    const securityRequirements: SecurityRequirementObject[] = []
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = [
      'oauth2Read',
      'oauth2Write',
    ]
    const securitySchemes: MergedSecuritySchemes = {
      oauth2Read: coerceValue(SecuritySchemeObjectSchema, {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            refreshUrl: 'https://example.com/oauth/refresh',
            scopes: {
              'read:users': 'Read user information',
              'read:posts': 'Read posts',
            },
          },
        },
        'x-default-scopes': ['read:users'],
      }),
      oauth2Write: coerceValue(SecuritySchemeObjectSchema, {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            refreshUrl: 'https://example.com/oauth/refresh',
            scopes: {
              'write:users': 'Write user information',
              'write:posts': 'Write posts',
            },
          },
        },
        'x-default-scopes': ['write:users', 'write:posts'],
      }),
    }

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)

    expect(result).toEqual({
      oauth2Read: ['read:users'],
      oauth2Write: ['write:users', 'write:posts'],
    })
  })
})
