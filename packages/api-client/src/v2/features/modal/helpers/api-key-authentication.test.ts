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
})
