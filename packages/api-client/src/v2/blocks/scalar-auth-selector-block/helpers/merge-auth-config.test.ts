import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type ComponentsObject,
  SecuritySchemeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { mergeAuthConfig } from './merge-auth-config'

describe('mergeAuthConfig', () => {
  it('returns empty object when both parameters are undefined', () => {
    const result = mergeAuthConfig({
      documentSecuritySchemes: {},
      configSecuritySchemes: {},
    })
    expect(result).toEqual({})
  })

  it('returns converted config when security schemes is undefined', () => {
    const config: AuthenticationConfiguration['securitySchemes'] = {
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        value: 'my-api-key',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        token: 'my-bearer-token',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
        username: 'test-user',
        password: 'test-pass',
      },
    }

    const result = mergeAuthConfig({
      documentSecuritySchemes: {},
      configSecuritySchemes: config,
    })

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
    })
    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    })
    expect(result.basicAuth).toMatchObject({
      type: 'http',
      scheme: 'basic',
    })
  })

  it('returns security schemes unchanged when config is empty', () => {
    const securitySchemes: ComponentsObject['securitySchemes'] = {
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    }

    const result = mergeAuthConfig({
      documentSecuritySchemes: securitySchemes,
      configSecuritySchemes: {},
    })
    expect(result).toEqual(securitySchemes)
  })

  it('merges config values into existing security schemes', () => {
    const securitySchemes: ComponentsObject['securitySchemes'] = {
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': '',
      } as any,
    }

    const config: AuthenticationConfiguration['securitySchemes'] = {
      apiKeyAuth: {
        type: 'apiKey',
        in: 'query',
      },
    }

    const result = mergeAuthConfig({
      documentSecuritySchemes: securitySchemes,
      configSecuritySchemes: config,
    })

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'query',
    })
  })

  it('handles deeply nested OAuth2 configuration merging', () => {
    const securitySchemes = {
      oauth2: coerceValue(SecuritySchemeObjectSchema, {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': 'Read user information',
              'write:users': 'Modify user information',
            },
          },
        },
      }),
    }

    const config: AuthenticationConfiguration['securitySchemes'] = {
      oauth2: {
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://updated-auth.com/oauth/authorize',
          },
        },
      },
    }

    const result = mergeAuthConfig({
      documentSecuritySchemes: securitySchemes,
      configSecuritySchemes: config,
    })

    expect(result.oauth2).toMatchObject({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://updated-auth.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'Read user information',
            'write:users': 'Modify user information',
          },
        },
      },
    })
  })

  it('preserves security schemes not mentioned in config', () => {
    const securitySchemes: ComponentsObject['securitySchemes'] = {
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    }

    const config: AuthenticationConfiguration['securitySchemes'] = {
      bearerAuth: {
        bearerFormat: 'JWT',
      },
    }

    const result = mergeAuthConfig({
      documentSecuritySchemes: securitySchemes,
      configSecuritySchemes: config,
    })

    expect(result).toHaveProperty('apiKeyAuth')
    expect(result).toHaveProperty('bearerAuth')
    expect(result).toHaveProperty('basicAuth')
    expect(result.apiKeyAuth).toEqual(securitySchemes!.apiKeyAuth)
    expect(result.basicAuth).toEqual(securitySchemes!.basicAuth)
    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
  })

  it('handles security schemes with $ref and $ref-value', () => {
    const securitySchemes: ComponentsObject['securitySchemes'] = {
      apiKeyAuth: {
        $ref: '#/components/securitySchemes/apiKeyAuth',
        '$ref-value': {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key authentication',
        },
      },
      bearerAuth: {
        $ref: '#/components/securitySchemes/bearerAuth',
        '$ref-value': {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token authentication',
        },
      },
      oauth2: {
        $ref: '#/components/securitySchemes/oauth2',
        '$ref-value': coerceValue(SecuritySchemeObjectSchema, {
          type: 'oauth2',
          description: 'OAuth2 authentication',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {
                'read:users': 'Read user information',
                'write:users': 'Modify user information',
              },
            },
          },
        }),
      },
    }

    const config: AuthenticationConfiguration['securitySchemes'] = {}

    const result = mergeAuthConfig({
      documentSecuritySchemes: securitySchemes,
      configSecuritySchemes: config,
    })

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      description: 'API Key authentication',
    })
    expect(result.apiKeyAuth).not.toHaveProperty('$ref')
    expect(result.apiKeyAuth).not.toHaveProperty('$ref-value')

    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Bearer token authentication',
    })
    expect(result.bearerAuth).not.toHaveProperty('$ref')
    expect(result.bearerAuth).not.toHaveProperty('$ref-value')

    expect(result.oauth2).toMatchObject({
      type: 'oauth2',
      description: 'OAuth2 authentication',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'Read user information',
            'write:users': 'Modify user information',
          },
        },
      },
    })
    expect(result.oauth2).not.toHaveProperty('$ref')
    expect(result.oauth2).not.toHaveProperty('$ref-value')
  })

  it('merges auth config into security schemes with $ref and $ref-value', () => {
    const securitySchemes: ComponentsObject['securitySchemes'] = {
      apiKeyAuth: {
        $ref: '#/components/securitySchemes/apiKeyAuth',
        '$ref-value': {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key authentication',
        },
      },
      bearerAuth: {
        $ref: '#/components/securitySchemes/bearerAuth',
        '$ref-value': {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token authentication',
        },
      },
      basicAuth: {
        $ref: '#/components/securitySchemes/basicAuth',
        '$ref-value': {
          type: 'http',
          scheme: 'basic',
          description: 'Basic authentication',
        },
      },
      oauth2: {
        $ref: '#/components/securitySchemes/oauth2',
        '$ref-value': coerceValue(SecuritySchemeObjectSchema, {
          type: 'oauth2',
          description: 'OAuth2 authentication',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {
                'read:users': 'Read user information',
                'write:users': 'Modify user information',
              },
            },
            password: {
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {
                'admin': 'Admin access',
              },
            },
          },
        }),
      },
    }

    const config: AuthenticationConfiguration['securitySchemes'] = {
      apiKeyAuth: {
        type: 'apiKey',
        description: 'Merged API Key authentication',
      },
      bearerAuth: {
        description: 'Merged Bearer token authentication',
      },
      basicAuth: {
        description: 'Merged Basic authentication',
      },
      oauth2: {
        flows: {
          authorizationCode: {
            clientSecret: 'merged-client-secret',
            selectedScopes: ['read:users'],
          },
          password: {
            token: 'merged-password-token',
            username: 'merged-oauth-user',
            password: 'merged-oauth-password',
            selectedScopes: ['admin'],
          },
        },
      },
    }

    const result = mergeAuthConfig({
      documentSecuritySchemes: securitySchemes,
      configSecuritySchemes: config,
    })

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      description: 'Merged API Key authentication',
    })

    expect(result.apiKeyAuth).not.toHaveProperty('$ref')
    expect(result.apiKeyAuth).not.toHaveProperty('$ref-value')

    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Merged Bearer token authentication',
    })
    expect(result.bearerAuth).not.toHaveProperty('$ref')
    expect(result.bearerAuth).not.toHaveProperty('$ref-value')

    expect(result.basicAuth).toMatchObject({
      type: 'http',
      scheme: 'basic',
      description: 'Merged Basic authentication',
    })
    expect(result.basicAuth).not.toHaveProperty('$ref')
    expect(result.basicAuth).not.toHaveProperty('$ref-value')

    expect(result.oauth2).toMatchObject({
      type: 'oauth2',
      description: 'OAuth2 authentication',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'Read user information',
            'write:users': 'Modify user information',
          },
          clientSecret: 'merged-client-secret',
          selectedScopes: ['read:users'],
        },
        password: {
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'admin': 'Admin access',
          },
          token: 'merged-password-token',
          username: 'merged-oauth-user',
          password: 'merged-oauth-password',
          selectedScopes: ['admin'],
        },
      },
    })
    expect(result.oauth2).not.toHaveProperty('$ref')
    expect(result.oauth2).not.toHaveProperty('$ref-value')
  })
})
