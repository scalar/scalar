import { requestExampleSchema, securitySchemeSchema } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { createRequestOperation } from './create-request-operation'
import { VOID_URL, createRequestPayload } from './create-request-operation.test'

describe('authentication', () => {
  it('adds apiKey auth in header', async () => {
    const scheme = securitySchemeSchema.parse({
      type: 'apiKey',
      name: 'X-API-KEY',
      in: 'header',
      value: 'test-key',
      uid: 'api-key',
      nameKey: 'X-API-KEY',
    })

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        [scheme.uid]: scheme,
      },
      selectedSecuritySchemeUids: [scheme.uid],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
      'x-api-key': 'test-key',
    })
  })

  it('adds apiKey auth in query', async () => {
    const scheme = securitySchemeSchema.parse({
      type: 'apiKey',
      name: 'api_key',
      in: 'query',
      value: 'test-key',
      uid: 'api-key',
      nameKey: 'api_key',
    })

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        [scheme.uid]: scheme,
      },
      selectedSecuritySchemeUids: [scheme.uid],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).query).toMatchObject({
      api_key: 'test-key',
    })
  })

  it('adds an apiKey query param', async () => {
    const scheme = securitySchemeSchema.parse({
      type: 'apiKey',
      name: 'api_key',
      in: 'query',
      value: 'test-key',
      uid: 'api-key',
      nameKey: 'api_key',
    })

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        [scheme.uid]: scheme,
      },
      selectedSecuritySchemeUids: [scheme.uid],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).query.api_key).toEqual('test-key')
  })

  it('adds basic auth header', async () => {
    const scheme = securitySchemeSchema.parse({
      type: 'http',
      scheme: 'basic',
      bearerFormat: 'Basic',
      token: '',
      username: 'user',
      password: 'pass',
      uid: 'basic-auth',
      nameKey: 'Authorization',
    })

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        [scheme.uid]: scheme,
      },
      selectedSecuritySchemeUids: [scheme.uid],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
      authorization: 'Basic dXNlcjpwYXNz', // base64 of "user:pass"
    })
  })

  it('adds bearer token header', async () => {
    const scheme = securitySchemeSchema.parse({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'Bearer',
      username: '',
      password: '',
      uid: 'bearer-auth',
      nameKey: 'Authorization',
      token: 'xxxx',
    })

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        [scheme.uid]: scheme,
      },
      selectedSecuritySchemeUids: [scheme.uid],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
      authorization: 'Bearer xxxx',
    })
  })

  it('handles complex auth', async () => {
    const scheme = securitySchemeSchema.parse({
      type: 'apiKey',
      name: 'api_key',
      in: 'query',
      value: 'xxxx',
      uid: 'api-key',
      nameKey: 'api_key',
    })
    const scheme2 = securitySchemeSchema.parse({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'Bearer',
      username: '',
      password: '',
      uid: 'bearer-auth',
      nameKey: 'Authorization',
      token: 'xxxx',
    })

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        [scheme.uid]: scheme,
        [scheme2.uid]: scheme2,
      },
      selectedSecuritySchemeUids: [[scheme2.uid, scheme.uid]],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    const parsed = JSON.parse(result?.response.data as string)
    expect(parsed.headers.authorization).toEqual('Bearer xxxx')
    expect(parsed.query.api_key).toEqual('xxxx')
  })

  it('adds oauth2 token header', async () => {
    const scheme = securitySchemeSchema.parse({
      type: 'oauth2',
      uid: 'oauth2-auth',
      nameKey: 'Authorization',
      flows: {
        implicit: {
          'type': 'implicit',
          'token': 'oauth-token',
          'authorizationUrl': 'https://example.com/auth',
          'refreshUrl': 'https://example.com/refresh',
          'scopes': {},
          'selectedScopes': [],
          'x-scalar-client-id': 'client-id',
          'x-scalar-redirect-uri': 'https://example.com/callback',
        },
      },
    })

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        [scheme.uid]: scheme,
      },
      selectedSecuritySchemeUids: [scheme.uid],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
      authorization: 'Bearer oauth-token',
    })
  })

  it('ensures we only have one auth header', async () => {
    const scheme = securitySchemeSchema.parse({
      type: 'oauth2',
      uid: 'oauth2-auth',
      flows: {
        implicit: {
          type: 'implicit',
          token: 'implicit-token',
        },
      },
    })

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      example: requestExampleSchema.parse({
        parameters: {
          headers: [
            {
              key: 'Authorization',
              value: 'Bearer header-token',
              enabled: true,
            },
          ],
        },
      }),
      securitySchemes: {
        [scheme.uid]: scheme,
      },
      selectedSecuritySchemeUids: [scheme.uid],
    })
    if (error) throw error

    expect(requestOperation.request.headers.get('Authorization')).toEqual('Bearer header-token')
  })
})
