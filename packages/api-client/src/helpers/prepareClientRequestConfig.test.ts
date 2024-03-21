import { describe, expect, it } from 'vitest'

import { encodeStringAsBase64 } from '../helpers'
import { type AuthState } from '../types'
import { prepareClientRequestConfig } from './prepareClientRequestConfig'

const defaultAuthState: AuthState = {
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

    const encodedAuthentication = encodeStringAsBase64(`foo:bar`)

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

    const encodedAuthentication = encodeStringAsBase64(`foo:bar`)

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

  it('sends body as JSON', async () => {
    const clientRequestConfig = prepareClientRequestConfig({
      request: {
        type: 'GET',
        url: 'https://example.com',
        path: '/',
        body: '{ "foo": "bar"}',
      },
      authState: { ...defaultAuthState },
    })

    expect(clientRequestConfig).toMatchObject({
      body: {
        foo: 'bar',
      },
    })
  })

  it('sends body as JSON', async () => {
    const clientRequestConfig = prepareClientRequestConfig({
      request: {
        type: 'GET',
        url: 'https://example.com',
        path: '/',
        body: '{ "foo": "bar"}',
      },
      authState: { ...defaultAuthState },
    })

    expect(clientRequestConfig).toMatchObject({
      body: {
        foo: 'bar',
      },
    })
  })

  it('adds a json header', async () => {
    const clientRequestConfig = prepareClientRequestConfig({
      request: {
        type: 'GET',
        url: 'https://example.com',
        path: '/',
        body: '{ "foo": "bar"}',
      },
      authState: { ...defaultAuthState },
    })

    expect(clientRequestConfig.headers).toMatchObject([
      {
        name: 'Content-Type',
        value: 'application/json; charset=utf-8',
      },
    ])
  })

  it('keeps content-type headers', async () => {
    const clientRequestConfig = prepareClientRequestConfig({
      request: {
        type: 'GET',
        url: 'https://example.com',
        path: '/',
        body: '{ "foo": "bar"}',
        headers: [
          {
            name: 'Content-Type',
            value: 'plain/text',
            enabled: true,
          },
        ],
      },
      authState: { ...defaultAuthState },
    })

    expect(clientRequestConfig.headers).toMatchObject([
      {
        name: 'Content-Type',
        value: 'plain/text',
      },
    ])
  })
})
