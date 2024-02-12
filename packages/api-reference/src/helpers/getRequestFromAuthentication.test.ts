import { describe, expect, it } from 'vitest'

import { createEmptyAuthenticationState } from '../stores/globalStore'
import { getRequestFromAuthentication } from './getRequestFromAuthentication'

describe('getRequestFromAuthentication', () => {
  it('apiKey in header', () => {
    const request = getRequestFromAuthentication(
      {
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
        securitySchemeKey: 'basic',
        securitySchemes: {
          basic: {
            // @ts-ignore
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

  it('oAuth2 token in header', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        securitySchemeKey: 'petstore_auth',
        securitySchemes: {
          petstore_auth: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl:
                  'https://petstore3.swagger.io/oauth/authorize',
                scopes: {
                  'write:pets': 'modify pets in your account',
                  'read:pets': 'read your pets',
                },
              },
            },
          },
        },
        oAuth2: {
          clientId: '123',
          scopes: [],
        },
      },
      [
        {
          petstore_auth: [],
        },
      ],
    )

    expect(request).toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer 123',
        },
      ],
    })
  })

  it('only return required security schemes', () => {
    const request = getRequestFromAuthentication(
      {
        ...createEmptyAuthenticationState(),
        securitySchemeKey: 'basic',
        securitySchemes: {
          basic: {
            // @ts-ignore
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
        securitySchemeKey: 'basic',
        securitySchemes: {
          basic: {
            // @ts-ignore
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
        securitySchemeKey: 'basic',
        securitySchemes: {
          basic: {
            // @ts-ignore
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
        securitySchemeKey: 'basic',
        securitySchemes: {
          basic: {
            // @ts-ignore
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
        securitySchemeKey: 'basic',
        securitySchemes: {
          basic: {
            // @ts-ignore
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
})
