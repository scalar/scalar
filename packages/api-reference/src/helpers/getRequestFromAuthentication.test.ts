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

  it.only('only return required security schemes', () => {
    const request = getRequestFromAuthentication(
      {
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

  it.only('doesn’t require auth if the security schema is empty', () => {
    const request = getRequestFromAuthentication(
      {
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
})
