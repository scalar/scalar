import { describe, expect, it } from 'vitest'

import { createRequestOperation } from './create-request-operation'
import { VOID_URL, createRequestPayload } from './create-request-operation.test'

describe('authentication', () => {
  it('adds apiKey auth in header', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'api-key': {
          type: 'apiKey',
          name: 'X-API-KEY',
          in: 'header',
          value: 'test-key',
          uid: 'api-key',
          nameKey: 'X-API-KEY',
        },
      },
      selectedSecuritySchemeUids: ['api-key'],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
      'x-api-key': 'test-key',
    })
  })

  it('adds apiKey auth in query', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'api-key': {
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
          value: 'test-key',
          uid: 'api-key',
          nameKey: 'api_key',
        },
      },
      selectedSecuritySchemeUids: ['api-key'],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).query).toMatchObject({
      api_key: 'test-key',
    })
  })

  it('adds the placeholder to query param if apiKey value is empty', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'api-key': {
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
          value: '',
          uid: 'api-key',
          nameKey: 'api_key',
        },
      },
      selectedSecuritySchemeUids: ['api-key'],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).query.api_key).toEqual(
      'YOUR_SECRET_TOKEN',
    )
  })

  it('adds basic auth header', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'basic-auth': {
          type: 'http',
          scheme: 'basic',
          bearerFormat: 'Basic',
          token: '',
          username: 'user',
          password: 'pass',
          uid: 'basic-auth',
          nameKey: 'Authorization',
        },
      },
      selectedSecuritySchemeUids: ['basic-auth'],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
      authorization: 'Basic dXNlcjpwYXNz', // base64 of "user:pass"
    })
  })

  it('adds bearer token header', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'bearer-auth': {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Bearer',
          username: '',
          password: '',
          uid: 'bearer-auth',
          nameKey: 'Authorization',
          token: 'xxxx',
        },
      },
      selectedSecuritySchemeUids: ['bearer-auth'],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
      authorization: 'Bearer xxxx',
    })
  })

  it('adds the placeholder to the the header if bearer token is empty', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'bearer-auth': {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Bearer',
          username: '',
          password: '',
          uid: 'bearer-auth',
          nameKey: 'Authorization',
          token: '',
        },
      },
      selectedSecuritySchemeUids: ['bearer-auth'],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(
      JSON.parse(result?.response.data as string).headers.authorization,
    ).toEqual('Bearer YOUR_SECRET_TOKEN')
  })

  it('handles complex auth', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'api-key': {
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
          value: 'xxxx',
          uid: 'api-key',
          nameKey: 'api_key',
        },
        'bearer-auth': {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Bearer',
          username: '',
          password: '',
          uid: 'bearer-auth',
          nameKey: 'Authorization',
          token: 'xxxx',
        },
      },
      selectedSecuritySchemeUids: [['bearer-auth', 'api-key']],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    const parsed = JSON.parse(result?.response.data as string)
    expect(parsed.headers.authorization).toEqual('Bearer xxxx')
    expect(parsed.query.api_key).toEqual('xxxx')
  })

  it('adds oauth2 token header', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
      securitySchemes: {
        'oauth2-auth': {
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
        },
      },
      selectedSecuritySchemeUids: ['oauth2-auth'],
    })
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
      authorization: 'Bearer oauth-token',
    })
  })
})
