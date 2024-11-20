import type { AuthenticationState } from '@scalar/types/legacy'
import { describe, expect, it } from 'vitest'

import { getRequestFromAuthentication } from './getRequestFromAuthentication'

const createEmptyAuthenticationState = (): AuthenticationState => ({
  preferredSecurityScheme: null,
  customSecurity: false,
  http: {
    basic: {
      username: '',
      password: '',
    },
    bearer: {
      token: '',
    },
  },
  apiKey: {
    token: '',
  },
  oAuth2: {
    username: '',
    password: '',
    clientId: '',
    scopes: [],
    accessToken: '',
    state: '',
  },
})

describe('getRequestFromAuthentication', () => {
  it('apiKey in header', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'api_key',
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
      },
      [
        {
          api_key: [],
        },
      ],
    )

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
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'api_key',
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
      },
      [
        {
          api_key: [],
        },
      ],
    )

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
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'api_key',
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
      },
      [
        {
          api_key: [],
        },
      ],
    )

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
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'basic',
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
      },
      [
        {
          basic: [],
        },
      ],
    )

    expect(request).toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: 'Basic Zm9vYmFyOnNlY3JldA==',
        },
      ],
    })
  })

  it('empty http basic auth', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'basic',
        securitySchemes: {
          basic: {
            type: 'basic',
          },
        },
        http: {
          ...createEmptyAuthenticationState().http,
          basic: {
            username: '',
            password: '',
          },
        },
      },
      [
        {
          basic: [],
        },
      ],
    )

    expect(request).toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: 'Basic',
        },
      ],
    })
  })

  it('oAuth2 token in header', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'my_custom_scheme',
        securitySchemes: {
          my_custom_scheme: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://galaxy.scalar.com/oauth/authorize',
                scopes: {
                  'write:planets': 'modify planets in your account',
                  'read:planets': 'get all information about planets',
                },
              },
            },
          },
        },
        oAuth2: {
          clientId: '123',
          scopes: [],
          accessToken: '',
          state: '',
          username: '',
          password: '',
        },
      },
      [
        {
          my_custom_scheme: [],
        },
      ],
    )

    expect(request).toHaveProperty('headers', [
      {
        name: 'Authorization',
        value: 'Bearer YOUR_SECRET_TOKEN',
      },
    ])
  })

  it('only return required security schemes', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'basic',
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
      },
      [
        {
          basic: [],
        },
      ],
    )

    expect(request).toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: 'Basic Zm9vYmFyOnNlY3JldA==',
        },
      ],
    })
  })

  it('only use required security schemes', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'basic',
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
      },
      [
        {
          basic: [],
        },
      ],
    )

    expect(request).toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: 'Basic Zm9vYmFyOnNlY3JldA==',
        },
      ],
    })
  })

  it('doesn’t require auth if the security schema is an empty array', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'basic',
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
      },
      // remove a top-level security declaration for a specific operation by using an empty array
      [],
    )

    expect(request).toMatchObject({
      headers: [],
      cookies: [],
      queryString: [],
    })
  })

  it('doesn’t require auth if the security is undefined', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'basic',
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
      },
      // remove a top-level security declaration for a specific operation by not defining `security`
      undefined,
    )

    expect(request).toMatchObject({
      headers: [],
      cookies: [],
      queryString: [],
    })
  })

  it('doesn’t require auth if an empty object is passed', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'basic',
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
      },
      [
        {
          basic: [],
        },
        // empty object
        {},
      ],
    )

    expect(request).toMatchObject({
      headers: [],
    })
  })

  it('uses custom security scheme for operation', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'bearerAuth',
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          v1Auth: {
            type: 'apiKey',
            name: 'X-Auth-Token',
            in: 'header',
            description: 'JWT token',
          },
        },
        apiKey: {
          token: '123',
        },
      },
      [
        {
          v1Auth: [],
        },
      ],
    )

    expect(request).toMatchObject({
      headers: [
        {
          name: 'X-Auth-Token',
          value: '123',
        },
      ],
    })
  })

  it('doesn’t complain about token being null', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        preferredSecurityScheme: 'api_key',
        securitySchemes: {
          api_key: {
            type: 'apiKey',
            name: 'api_key',
            in: 'header',
          },
        },
        apiKey: {
          // @ts-expect-error pass rubbish
          token: null,
        },
      },
      [
        {
          api_key: [],
        },
      ],
    )

    expect(request).toMatchObject({
      headers: [
        {
          name: 'api_key',
          value: 'YOUR_TOKEN',
        },
      ],
    })
  })
})
