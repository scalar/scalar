import type {
  MergedSecuritySchemes,
  SecuritySchemeObjectSecret,
} from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type {
  SecurityRequirementObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getDefaultScopes, getDefaultSecurity } from './get-default-security'

describe('getDefaultScopes', () => {
  it('returns empty array for non-oauth2 schemes', () => {
    const apiKeyScheme: SecuritySchemeObject = {
      type: 'apiKey',
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
    const oauth2Scheme = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          'x-usePkce': 'no',
          'x-scalar-secret-client-id': 'test-client-id',
          'x-scalar-secret-client-secret': 'test-client-secret',
          'x-scalar-secret-redirect-uri': 'https://example.com/oauth/callback',
          'x-scalar-secret-token': 'test-token',
          refreshUrl: 'https://example.com/oauth/refresh',
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'Read user information',
            'write:users': 'Write user information',
          },
        },
      },
      'x-default-scopes': ['read:users', 'write:users'],
    } satisfies SecuritySchemeObjectSecret

    const result = getDefaultScopes(oauth2Scheme)
    expect(result).toEqual(['read:users', 'write:users'])
  })

  it('returns empty array for oauth2 scheme without x-default-scopes', () => {
    const oauth2Scheme = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          'x-usePkce': 'no',
          'x-scalar-secret-client-id': 'test-client-id',
          'x-scalar-secret-client-secret': 'test-client-secret',
          'x-scalar-secret-redirect-uri': 'https://example.com/oauth/callback',
          'x-scalar-secret-token': 'test-token',
          refreshUrl: 'https://example.com/oauth/refresh',
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'Read user information',
          },
        },
      },
    } satisfies SecuritySchemeObjectSecret

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
      oauth2Auth: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            'x-usePkce': 'no',
            'x-scalar-secret-client-id': 'test-client-id',
            'x-scalar-secret-client-secret': 'test-client-secret',
            'x-scalar-secret-redirect-uri': 'https://example.com/oauth/callback',
            'x-scalar-secret-token': 'test-token',
            refreshUrl: 'https://example.com/oauth/refresh',
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': 'Read user information',
              'write:users': 'Write user information',
            },
          },
        },
        'x-default-scopes': ['read:users'],
      } satisfies SecuritySchemeObjectSecret,
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'test-token',
      } satisfies SecuritySchemeObjectSecret,
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
      oauth2Auth: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            'x-usePkce': 'no',
            'x-scalar-secret-client-id': 'test-client-id',
            'x-scalar-secret-client-secret': 'test-client-secret',
            'x-scalar-secret-redirect-uri': 'https://example.com/oauth/callback',
            'x-scalar-secret-token': 'test-token',
            refreshUrl: 'https://example.com/oauth/refresh',
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': 'Read user information',
              'write:users': 'Write user information',
            },
          },
        },
        'x-default-scopes': ['read:users', 'write:users'],
      } satisfies SecuritySchemeObjectSecret,
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'test-token',
      } satisfies SecuritySchemeObjectSecret,
      basicAuth: {
        type: 'http',
        scheme: 'basic',
        'x-scalar-secret-username': 'test-username',
        'x-scalar-secret-password': 'test-password',
        'x-scalar-secret-token': 'test-token',
      } satisfies SecuritySchemeObjectSecret,
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
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'test-token',
      } satisfies SecuritySchemeObjectSecret,
      oauth2Auth: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            'x-usePkce': 'no',
            'x-scalar-secret-client-id': 'test-client-id',
            'x-scalar-secret-client-secret': 'test-client-secret',
            'x-scalar-secret-redirect-uri': 'https://example.com/oauth/callback',
            'x-scalar-secret-token': 'test-token',
            refreshUrl: 'https://example.com/oauth/refresh',
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': 'Read user information',
            },
          },
        },
        'x-default-scopes': ['read:users'],
      } satisfies SecuritySchemeObjectSecret,
    }

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)

    expect(result).toEqual({ apiKeyAuth: [] })
  })

  it('handles security scheme with $ref-value wrapper', () => {
    const securityRequirements: SecurityRequirementObject[] = []
    const preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'] = ['oauth2Auth']
    const securitySchemes: MergedSecuritySchemes = {
      oauth2Auth: {
        // @ts-expect-error - yolo
        $ref: '#/components/securitySchemes/oauth2Auth',
        '$ref-value': {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              'x-usePkce': 'no',
              'x-scalar-secret-client-id': 'test-client-id',
              'x-scalar-secret-client-secret': 'test-client-secret',
              'x-scalar-secret-redirect-uri': 'https://example.com/oauth/callback',
              'x-scalar-secret-token': 'test-token',
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              refreshUrl: 'https://example.com/oauth/refresh',
              scopes: {
                'admin': 'Admin access',
              },
            },
          },
          'x-default-scopes': ['admin'],
        } satisfies SecuritySchemeObjectSecret,
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
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'test-token',
      } satisfies SecuritySchemeObjectSecret,
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
      oauth2Read: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            'x-usePkce': 'no',
            'x-scalar-secret-client-id': 'test-client-id',
            'x-scalar-secret-client-secret': 'test-client-secret',
            'x-scalar-secret-redirect-uri': 'https://example.com/oauth/callback',
            'x-scalar-secret-token': 'test-token',
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
      } satisfies SecuritySchemeObjectSecret,
      oauth2Write: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            'x-usePkce': 'no',
            'x-scalar-secret-client-id': 'test-client-id',
            'x-scalar-secret-client-secret': 'test-client-secret',
            'x-scalar-secret-redirect-uri': 'https://example.com/oauth/callback',
            'x-scalar-secret-token': 'test-token',
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
      } satisfies SecuritySchemeObjectSecret,
    }

    const result = getDefaultSecurity(securityRequirements, preferredSecurityScheme, securitySchemes)

    expect(result).toEqual({
      oauth2Read: ['read:users'],
      oauth2Write: ['write:users', 'write:posts'],
    })
  })
})
