import { describe, expect, it } from 'vitest'

import { prepareClientRequestConfig } from './prepareClientRequestConfig'

describe('prepareClientRequestConfig', () => {
  it('sends body as JSON', async () => {
    const clientRequestConfig = prepareClientRequestConfig({
      request: {
        type: 'GET',
        url: 'https://example.com',
        path: '/',
        body: '{ "foo": "bar"}',
      },
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
    })

    expect(clientRequestConfig.headers).toMatchObject([
      {
        name: 'Content-Type',
        value: 'plain/text',
      },
    ])
  })
})
