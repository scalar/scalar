import { describe, expect, it } from 'vitest'

import { createEmptyAuthenticationState } from '../stores/globalStore'
import { getRequestFromAuthentication } from './getRequestFromAuthentication'

describe('getRequestFromAuthentication', () => {
  it('apiKey in header', () => {
    const request = getRequestFromAuthentication({
      ...createEmptyAuthenticationState(),
      securitySchemeKey: 'api_key',
      securitySchemes: {
        api_key: {
          type: 'apiKey',
          name: 'api_key',
          in: 'header',
        },
      },
      apiKey: {
        token: '123',
      },
    })

    expect(request).toMatchObject({
      headers: [
        {
          name: 'api_key',
          value: '123',
        },
      ],
    })
  })

  it('apiKey in cookie', () => {
    const request = getRequestFromAuthentication({
      ...createEmptyAuthenticationState(),
      securitySchemeKey: 'api_key',
      securitySchemes: {
        api_key: {
          type: 'apiKey',
          name: 'api_key',
          in: 'cookie',
        },
      },
      apiKey: {
        token: '123',
      },
    })

    expect(request).toMatchObject({
      cookies: [
        {
          name: 'api_key',
          value: '123',
        },
      ],
    })
  })

  it('apiKey in query', () => {
    const request = getRequestFromAuthentication({
      ...createEmptyAuthenticationState(),
      securitySchemeKey: 'api_key',
      securitySchemes: {
        api_key: {
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
        },
      },
      apiKey: {
        token: '123',
      },
    })

    expect(request).toMatchObject({
      queryString: [
        {
          name: 'api_key',
          value: '123',
        },
      ],
    })
  })

  it('http basic auth', () => {
    const request = getRequestFromAuthentication({
      ...createEmptyAuthenticationState(),
      securitySchemeKey: 'basic',
      securitySchemes: {
        basic: {
          type: 'basic',
        },
      },
      http: {
        ...createEmptyAuthenticationState().http,
        basic: {
          username: 'foobar',
          password: 'secret',
        },
      },
    })

    expect(request).toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: 'Basic Zm9vYmFyOnNlY3JldA==',
        },
      ],
    })
  })
})
