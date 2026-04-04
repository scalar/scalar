import type { SelectedSecuritySchemeUids } from '@scalar/oas-utils/entities/shared'
import { securitySchemeSchema } from '@scalar/oas-utils/entities/spec'
import { VOID_URL, createRequestPayload } from '@test/helpers'
import { beforeAll, describe, expect, it } from 'vitest'

import { createRequestOperation } from '@/libs/send-request/create-request-operation'

beforeAll(async () => {
  // Check whether the void-server is running
  try {
    const result = await fetch(VOID_URL)

    if (result.ok) {
      return
    }
  } catch (_error) {
    throw new Error(`
[api-key-authentication.test.ts] Looks like you're not running @scalar/void-server on <http://127.0.0.1:5052>, but it's required for this test file.

Try to run it like this from the repo root:

$ pnpm script run test-servers
`)
  }
})

/**
 * Tests for API key authentication configured via the authentication.securitySchemes option.
 * These tests verify that authentication values set through the configuration API
 * (as used in framework integrations like @scalar/hono-api-reference) are correctly
 * transmitted in HTTP requests.
 *
 * Regression tests for issue #8739
 */
describe('api-key-authentication', () => {
  it('sends API key value from configuration when OpenAPI spec only defines the scheme structure (exact GitHub issue #8739 scenario)', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'apiKeyAuth': securitySchemeSchema.parse({
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          value: 'my-secret-key',
          uid: 'apiKeyAuth',
          nameKey: 'X-API-Key',
        }),
      },
      selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
    })
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    const responseData = JSON.parse(result?.response.data as string)
    expect(responseData.headers['x-api-key']).not.toBe('')
    expect(responseData.headers['x-api-key']).toBe('my-secret-key')
  })

  it('sends API key in header when configured via authentication.securitySchemes', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'apiKeyAuth': securitySchemeSchema.parse({
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          value: 'my-secret-key',
          uid: 'apiKeyAuth',
          nameKey: 'X-API-Key',
        }),
      },
      selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
    })
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    const responseData = JSON.parse(result?.response.data as string)
    expect(responseData.headers['x-api-key']).toBe('my-secret-key')
  })

  it('sends API key in query parameter when configured via authentication.securitySchemes', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'apiKeyAuth': securitySchemeSchema.parse({
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
          value: 'my-secret-key',
          uid: 'apiKeyAuth',
          nameKey: 'api_key',
        }),
      },
      selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
    })
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    const responseData = JSON.parse(result?.response.data as string)
    expect(responseData.query.api_key).toBe('my-secret-key')
  })

  it('sends API key in cookie when configured via authentication.securitySchemes', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'apiKeyAuth': securitySchemeSchema.parse({
          type: 'apiKey',
          name: 'auth-cookie',
          in: 'cookie',
          value: 'my-secret-key',
          uid: 'apiKeyAuth',
          nameKey: 'auth-cookie',
        }),
      },
      selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
    })
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    const responseData = JSON.parse(result?.response.data as string)
    expect(responseData.cookies['auth-cookie']).toBe('my-secret-key')
  })

  it('does not send empty string when API key value is not configured', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'apiKeyAuth': securitySchemeSchema.parse({
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          value: '',
          uid: 'apiKeyAuth',
          nameKey: 'X-API-Key',
        }),
      },
      selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
    })
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    const responseData = JSON.parse(result?.response.data as string)
    expect(responseData.headers['x-api-key']).toBe('')
  })

  it('sends Bearer token when configured via authentication.securitySchemes', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'bearerAuth': securitySchemeSchema.parse({
          type: 'http',
          scheme: 'bearer',
          token: 'my-bearer-token',
          uid: 'bearerAuth',
          nameKey: 'Authorization',
        }),
      },
      selectedSecuritySchemeUids: ['bearerAuth'] as SelectedSecuritySchemeUids,
    })
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    const responseData = JSON.parse(result?.response.data as string)
    expect(responseData.headers.authorization).toBe('Bearer my-bearer-token')
  })

  it('sends Basic auth when configured via authentication.securitySchemes', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'basicAuth': securitySchemeSchema.parse({
          type: 'http',
          scheme: 'basic',
          username: 'test-user',
          password: 'test-password',
          uid: 'basicAuth',
          nameKey: 'Authorization',
        }),
      },
      selectedSecuritySchemeUids: ['basicAuth'] as SelectedSecuritySchemeUids,
    })
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    const responseData = JSON.parse(result?.response.data as string)
    expect(responseData.headers.authorization).toMatch(/^Basic /)
  })

  describe('multiple authentication schemes', () => {
    it('sends multiple API keys in different locations simultaneously', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'headerApiKey': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            value: 'header-key-123',
            uid: 'headerApiKey',
            nameKey: 'X-API-Key',
          }),
          'queryApiKey': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'api_key',
            in: 'query',
            value: 'query-key-456',
            uid: 'queryApiKey',
            nameKey: 'api_key',
          }),
        },
        selectedSecuritySchemeUids: [['headerApiKey', 'queryApiKey']] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers['x-api-key']).toBe('header-key-123')
      expect(responseData.query.api_key).toBe('query-key-456')
    })

    it('sends API key and Bearer token together', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'apiKeyAuth': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            value: 'api-key-value',
            uid: 'apiKeyAuth',
            nameKey: 'X-API-Key',
          }),
          'bearerAuth': securitySchemeSchema.parse({
            type: 'http',
            scheme: 'bearer',
            token: 'bearer-token-value',
            uid: 'bearerAuth',
            nameKey: 'Authorization',
          }),
        },
        selectedSecuritySchemeUids: [['apiKeyAuth', 'bearerAuth']] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers['x-api-key']).toBe('api-key-value')
      expect(responseData.headers.authorization).toBe('Bearer bearer-token-value')
    })
  })

  describe('edge cases and error handling', () => {
    it('handles API key with special characters', async () => {
      const specialKey = 'key-with-!@#$%^&*()_+-=[]{}|;:,.<>?'
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'apiKeyAuth': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            value: specialKey,
            uid: 'apiKeyAuth',
            nameKey: 'X-API-Key',
          }),
        },
        selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers['x-api-key']).toBe(specialKey)
    })

    it('handles API key with very long value', async () => {
      const longKey = 'a'.repeat(1000)
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'apiKeyAuth': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            value: longKey,
            uid: 'apiKeyAuth',
            nameKey: 'X-API-Key',
          }),
        },
        selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers['x-api-key']).toBe(longKey)
      expect(responseData.headers['x-api-key'].length).toBe(1000)
    })

    it('handles API key with Latin-1 characters', async () => {
      const latinKey = 'key-with-àéîöü-characters'
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'apiKeyAuth': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            value: latinKey,
            uid: 'apiKeyAuth',
            nameKey: 'X-API-Key',
          }),
        },
        selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers['x-api-key']).toBe(latinKey)
    })

    it('handles API key with whitespace (trimmed by HTTP spec)', async () => {
      const keyWithSpaces = '  key with spaces  '
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'apiKeyAuth': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            value: keyWithSpaces,
            uid: 'apiKeyAuth',
            nameKey: 'X-API-Key',
          }),
        },
        selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers['x-api-key']).toBe('key with spaces')
    })

    it('handles Bearer token with special characters', async () => {
      const specialToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'bearerAuth': securitySchemeSchema.parse({
            type: 'http',
            scheme: 'bearer',
            token: specialToken,
            uid: 'bearerAuth',
            nameKey: 'Authorization',
          }),
        },
        selectedSecuritySchemeUids: ['bearerAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers.authorization).toBe(`Bearer ${specialToken}`)
    })

    it('handles Basic auth with special characters in username and password', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'basicAuth': securitySchemeSchema.parse({
            type: 'http',
            scheme: 'basic',
            username: 'user@example.com',
            password: 'p@ssw0rd!#$%',
            uid: 'basicAuth',
            nameKey: 'Authorization',
          }),
        },
        selectedSecuritySchemeUids: ['basicAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers.authorization).toMatch(/^Basic /)
    })
  })

  describe('environment variable substitution', () => {
    it('replaces environment variables in API key values', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        environment: {
          API_KEY: 'env-api-key-value',
        },
        securitySchemes: {
          'apiKeyAuth': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            value: '{{API_KEY}}',
            uid: 'apiKeyAuth',
            nameKey: 'X-API-Key',
          }),
        },
        selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers['x-api-key']).toBe('env-api-key-value')
    })

    it('replaces environment variables in Bearer tokens', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        environment: {
          BEARER_TOKEN: 'env-bearer-token',
        },
        securitySchemes: {
          'bearerAuth': securitySchemeSchema.parse({
            type: 'http',
            scheme: 'bearer',
            token: '{{BEARER_TOKEN}}',
            uid: 'bearerAuth',
            nameKey: 'Authorization',
          }),
        },
        selectedSecuritySchemeUids: ['bearerAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers.authorization).toBe('Bearer env-bearer-token')
    })

    it('replaces environment variables in Basic auth credentials', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        environment: {
          USERNAME: 'env-username',
          PASSWORD: 'env-password',
        },
        securitySchemes: {
          'basicAuth': securitySchemeSchema.parse({
            type: 'http',
            scheme: 'basic',
            username: '{{USERNAME}}',
            password: '{{PASSWORD}}',
            uid: 'basicAuth',
            nameKey: 'Authorization',
          }),
        },
        selectedSecuritySchemeUids: ['basicAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers.authorization).toMatch(/^Basic /)
    })

    it('handles missing environment variables gracefully', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        environment: {},
        securitySchemes: {
          'apiKeyAuth': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            value: '{{MISSING_VAR}}',
            uid: 'apiKeyAuth',
            nameKey: 'X-API-Key',
          }),
        },
        selectedSecuritySchemeUids: ['apiKeyAuth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers['x-api-key']).toBe('{{MISSING_VAR}}')
    })
  })

  describe('OAuth2 authentication', () => {
    it('sends OAuth2 implicit flow token', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'oauth2Auth': securitySchemeSchema.parse({
            type: 'oauth2',
            uid: 'oauth2Auth',
            nameKey: 'Authorization',
            flows: {
              implicit: {
                'type': 'implicit',
                'token': 'oauth2-implicit-token',
                'authorizationUrl': 'https://example.com/oauth/authorize',
                'scopes': {},
                'selectedScopes': [],
                'x-scalar-client-id': 'client-id',
                'x-scalar-redirect-uri': 'https://example.com/callback',
              },
            },
          }),
        },
        selectedSecuritySchemeUids: ['oauth2Auth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers.authorization).toBe('Bearer oauth2-implicit-token')
    })

    it('sends OAuth2 authorization code flow token', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'oauth2Auth': securitySchemeSchema.parse({
            type: 'oauth2',
            uid: 'oauth2Auth',
            nameKey: 'Authorization',
            flows: {
              authorizationCode: {
                'type': 'authorizationCode',
                'token': 'oauth2-auth-code-token',
                'authorizationUrl': 'https://example.com/oauth/authorize',
                'tokenUrl': 'https://example.com/oauth/token',
                'scopes': {},
                'selectedScopes': [],
                'x-scalar-client-id': 'client-id',
                'x-scalar-redirect-uri': 'https://example.com/callback',
              },
            },
          }),
        },
        selectedSecuritySchemeUids: ['oauth2Auth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result?.response.data as string)
      expect(responseData.headers.authorization).toBe('Bearer oauth2-auth-code-token')
    })
  })
})
