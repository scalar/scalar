import { createEchoServer } from '@scalar/echo-server'
import { describe, expect, it } from 'vitest'

import { prepareClientRequestConfig } from './prepareClientRequestConfig'

const defaultAuthState = {
  type: 'none',
  basic: {
    username: '',
    password: '',
    active: true,
  },
  oauthTwo: {
    generatedToken: '',
    discoveryURL: '',
    authURL: '',
    accessTokenURL: '',
    clientID: '',
    clientSecret: '',
    scope: '',
    active: true,
  },
  bearer: {
    token: '',
    active: true,
  },
  digest: {
    username: '',
    password: '',
    active: true,
  },
}

describe('prepareClientRequestConfig', () => {
  it('adds basic auth', async () => {
    const clientRequestConfig = prepareClientRequestConfig({
      request: {
        type: 'GET',
        url: 'https://example.com',
        path: '/',
      },
      authState: {
        ...defaultAuthState,
        type: 'basic',
        basic: {
          username: 'foo',
          password: 'bar',
          active: true,
        },
      },
    })

    const encodedAuthentication = Buffer.from(`foo:bar`).toString('base64')

    expect(clientRequestConfig).toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: `Basic ${encodedAuthentication}`,
        },
      ],
    })
  })

  it('doesn’t add basic auth if it’s disabled', async () => {
    const clientRequestConfig = prepareClientRequestConfig({
      request: {
        type: 'GET',
        url: 'https://example.com',
        path: '/',
      },
      authState: {
        ...defaultAuthState,
        type: 'basic',
        basic: {
          username: 'foo',
          password: 'bar',
          active: false,
        },
      },
    })

    const encodedAuthentication = Buffer.from(`foo:bar`).toString('base64')

    expect(clientRequestConfig).not.toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: `Basic ${encodedAuthentication}`,
        },
      ],
    })
  })

  it('adds a bearer token header', async () => {
    const clientRequestConfig = prepareClientRequestConfig({
      request: {
        type: 'GET',
        url: 'https://example.com',
        path: '/',
      },
      authState: {
        ...defaultAuthState,
        type: 'bearer',
        bearer: {
          token: '123',
          active: true,
        },
      },
    })

    expect(clientRequestConfig).toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer 123',
        },
      ],
    })
  })

  it('doesn’t add a bearer token if it’s disabled', async () => {
    const clientRequestConfig = prepareClientRequestConfig({
      request: {
        type: 'GET',
        url: 'https://example.com',
        path: '/',
      },
      authState: {
        ...defaultAuthState,
        type: 'bearer',
        bearer: {
          token: '123',
          active: false,
        },
      },
    })

    expect(clientRequestConfig).not.toMatchObject({
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer 123',
        },
      ],
    })
  })
})
