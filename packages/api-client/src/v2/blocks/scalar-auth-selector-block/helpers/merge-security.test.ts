import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type ComponentsObject,
  SecuritySchemeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { mergeSecurity } from './merge-security'

describe('mergeSecurity', () => {
  const workspaceStore = createWorkspaceStore()
  const authStore = workspaceStore.auth
  const documentSlug = 'test-document'

  it('returns empty object when both parameters are undefined', () => {
    const result = mergeSecurity(undefined, undefined, authStore, documentSlug)
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

    const result = mergeSecurity(undefined, config, authStore, documentSlug)

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': 'my-api-key',
    })
    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      'x-scalar-secret-token': 'my-bearer-token',
    })
    expect(result.basicAuth).toMatchObject({
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-username': 'test-user',
      'x-scalar-secret-password': 'test-pass',
    })
  })

  it('returns security schemes with secret fields when config is empty', () => {
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

    const result = mergeSecurity(securitySchemes, {}, authStore, documentSlug)

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': '',
    })

    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      'x-scalar-secret-token': '',
      'x-scalar-secret-username': '',
      'x-scalar-secret-password': '',
    })
  })

  it('merges config values into existing security schemes', () => {
    const securitySchemes: ComponentsObject['securitySchemes'] = {
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
    }

    const config: AuthenticationConfiguration['securitySchemes'] = {
      apiKeyAuth: {
        type: 'apiKey',
        value: 'my-secret-token',
      },
    }

    const result = mergeSecurity(securitySchemes, config, authStore, documentSlug)

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': 'my-secret-token',
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
            token: 'existing-access-token',
          },
        },
      },
    }

    const result = mergeSecurity(securitySchemes, config, authStore, documentSlug)

    expect(result.oauth2).toMatchObject({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          token: 'existing-access-token',
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
        token: 'my-bearer-token',
      },
    }

    const result = mergeSecurity(securitySchemes, config, authStore, documentSlug)

    expect(result).toHaveProperty('apiKeyAuth')
    expect(result).toHaveProperty('bearerAuth')
    expect(result).toHaveProperty('basicAuth')

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': '',
    })

    expect(result.basicAuth).toMatchObject({
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-token': '',
      'x-scalar-secret-username': '',
      'x-scalar-secret-password': '',
    })

    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      'x-scalar-secret-token': 'my-bearer-token',
    })
  })

  it('merges comprehensive auth configuration with all security scheme types', () => {
    const securitySchemes: ComponentsObject['securitySchemes'] = {
      apiKeyHeader: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key in header',
      },
      apiKeyQuery: {
        type: 'apiKey',
        name: 'api_key',
        in: 'query',
        description: 'API Key in query',
      },
      apiKeyCookie: {
        type: 'apiKey',
        name: 'session',
        in: 'cookie',
        description: 'API Key in cookie',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
        description: 'Basic authentication',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer token authentication',
      },
      oauth2AllFlows: coerceValue(SecuritySchemeObjectSchema, {
        type: 'oauth2',
        description: 'OAuth2 with all flows',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {
              'read:data': 'Read data',
              'write:data': 'Write data',
            },
          },
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'admin': 'Admin access',
            },
          },
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'api:access': 'API access',
            },
          },
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'profile': 'User profile',
              'email': 'Email address',
            },
          },
        },
      }),
      openIdConnect: {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        description: 'OpenID Connect authentication',
      },
    }

    const config: AuthenticationConfiguration['securitySchemes'] = {
      apiKeyHeader: {
        type: 'apiKey',
        value: 'header-api-key-value',
      },
      apiKeyQuery: {
        type: 'apiKey',
        value: 'query-api-key-value',
      },
      apiKeyCookie: {
        type: 'apiKey',
        value: 'cookie-session-value',
      },
      basicAuth: {
        username: 'test-user',
        password: 'test-password',
      },
      bearerAuth: {
        token: 'bearer-jwt-token',
      },
      oauth2AllFlows: {
        flows: {
          implicit: {
            token: 'implicit-access-token',
            selectedScopes: ['read:data'],
          },
          password: {
            token: 'password-access-token',
            username: 'oauth-user',
            password: 'oauth-password',
            clientSecret: 'password-client-secret',
            selectedScopes: ['admin'],
          },
          clientCredentials: {
            token: 'client-credentials-token',
            clientSecret: 'credentials-client-secret',
            selectedScopes: ['api:access'],
          },
          authorizationCode: {
            token: 'auth-code-token',
            clientSecret: 'auth-code-client-secret',
            selectedScopes: ['profile', 'email'],
          },
        },
      },
    }

    const result = mergeSecurity(securitySchemes, config, authStore, documentSlug)

    expect(result.apiKeyHeader).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      description: 'API Key in header',
      'x-scalar-secret-token': 'header-api-key-value',
    })

    expect(result.apiKeyQuery).toMatchObject({
      type: 'apiKey',
      name: 'api_key',
      in: 'query',
      description: 'API Key in query',
      'x-scalar-secret-token': 'query-api-key-value',
    })

    expect(result.apiKeyCookie).toMatchObject({
      type: 'apiKey',
      name: 'session',
      in: 'cookie',
      description: 'API Key in cookie',
      'x-scalar-secret-token': 'cookie-session-value',
    })

    expect(result.basicAuth).toMatchObject({
      type: 'http',
      scheme: 'basic',
      description: 'Basic authentication',
      username: 'test-user',
      password: 'test-password',
    })

    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Bearer token authentication',
      token: 'bearer-jwt-token',
    })

    expect(result.oauth2AllFlows).toMatchObject({
      type: 'oauth2',
      description: 'OAuth2 with all flows',
      flows: {
        implicit: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          token: 'implicit-access-token',
          selectedScopes: ['read:data'],
          scopes: {
            'read:data': 'Read data',
            'write:data': 'Write data',
          },
        },
        password: {
          tokenUrl: 'https://example.com/oauth/token',
          token: 'password-access-token',
          username: 'oauth-user',
          password: 'oauth-password',
          clientSecret: 'password-client-secret',
          selectedScopes: ['admin'],
          scopes: {
            'admin': 'Admin access',
          },
        },
        clientCredentials: {
          tokenUrl: 'https://example.com/oauth/token',
          token: 'client-credentials-token',
          clientSecret: 'credentials-client-secret',
          selectedScopes: ['api:access'],
          scopes: {
            'api:access': 'API access',
          },
        },
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          token: 'auth-code-token',
          clientSecret: 'auth-code-client-secret',
          selectedScopes: ['profile', 'email'],
          scopes: {
            'profile': 'User profile',
            'email': 'Email address',
          },
        },
      },
    })

    expect(result.openIdConnect).toMatchObject({
      type: 'openIdConnect',
      openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      description: 'OpenID Connect authentication',
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
              'x-scalar-secret-token': 'existing-oauth-token',
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

    const result = mergeSecurity(securitySchemes, config, authStore, documentSlug)

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      description: 'API Key authentication',
      'x-scalar-secret-token': '',
    })
    expect(result.apiKeyAuth).not.toHaveProperty('$ref')
    expect(result.apiKeyAuth).not.toHaveProperty('$ref-value')

    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Bearer token authentication',
      'x-scalar-secret-token': '',
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
          'x-scalar-secret-token': '',
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
        value: 'merged-api-key-value',
      },
      bearerAuth: {
        token: 'merged-bearer-token',
      },
      basicAuth: {
        username: 'merged-username',
        password: 'merged-password',
      },
      oauth2: {
        flows: {
          authorizationCode: {
            token: 'merged-oauth-token',
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

    const result = mergeSecurity(securitySchemes, config, authStore, documentSlug)

    expect(result.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      description: 'API Key authentication',
      'x-scalar-secret-token': 'merged-api-key-value',
    })
    expect(result.apiKeyAuth).not.toHaveProperty('$ref')
    expect(result.apiKeyAuth).not.toHaveProperty('$ref-value')

    expect(result.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Bearer token authentication',
      'x-scalar-secret-token': 'merged-bearer-token',
    })
    expect(result.bearerAuth).not.toHaveProperty('$ref')
    expect(result.bearerAuth).not.toHaveProperty('$ref-value')

    expect(result.basicAuth).toMatchObject({
      type: 'http',
      scheme: 'basic',
      description: 'Basic authentication',
      'x-scalar-secret-username': 'merged-username',
      'x-scalar-secret-password': 'merged-password',
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
          token: 'merged-oauth-token',
          clientSecret: 'merged-client-secret',
          selectedScopes: ['read:users'],
          scopes: {
            'read:users': 'Read user information',
            'write:users': 'Modify user information',
          },
        },
        password: {
          tokenUrl: 'https://example.com/oauth/token',
          token: 'merged-password-token',
          username: 'merged-oauth-user',
          password: 'merged-oauth-password',
          selectedScopes: ['admin'],
          scopes: {
            'admin': 'Admin access',
          },
        },
      },
    })
    expect(result.oauth2).not.toHaveProperty('$ref')
    expect(result.oauth2).not.toHaveProperty('$ref-value')
  })
})
