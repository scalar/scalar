import { createApiClientProxy } from '@scalar/api-client-proxy'
import { createEchoServer } from '@scalar/echo-server'
import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'

import { sendRequest } from './sendRequest'

const createEchoServerOnAnyPort = (): number => {
  const { listen } = createEchoServer()
  const instance = listen(0)

  return Number((instance.address() as AddressInfo).port)
}

const createApiClientProxyOnAnyPort = (): number => {
  const { listen } = createApiClientProxy()
  const instance = listen(0)

  return Number((instance.address() as AddressInfo).port)
}

describe('sendRequest', () => {
  it('sends requests', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}`,
    }

    const result = await sendRequest(request)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  it('replaces variables', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}`,
      path: '{path}',
      variables: [
        {
          name: 'path',
          value: 'example',
          enabled: true,
        },
      ],
    }

    const result = await sendRequest(request)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      method: 'GET',
      path: '/example',
    })
  })

  it('sends query parameters', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}`,
      query: [
        {
          name: 'foo',
          value: 'bar',
          enabled: true,
        },
      ],
    }

    const result = await sendRequest(request)

    expect(
      (JSON.parse(result?.response.data ?? '') as Record<string, any>).query,
    ).toMatchObject({
      foo: 'bar',
    })
  })

  it('merges query parameters', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}?example=parameter`,
      query: [
        {
          name: 'foo',
          value: 'bar',
          enabled: true,
        },
      ],
    }

    const result = await sendRequest(request)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      query: {
        example: 'parameter',
        foo: 'bar',
      },
    })
  })

  it('adds cookies as headers', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}`,
      cookies: [
        {
          name: 'foo',
          value: 'bar',
          enabled: true,
        },
      ],
    }

    const result = await sendRequest(request)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      cookies: {
        foo: 'bar',
      },
    })
  })

  it('merges cookies', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}`,
      cookies: [
        {
          name: 'foo',
          value: 'bar',
          enabled: true,
        },
        {
          name: 'another',
          value: 'cookie',
          enabled: true,
        },
      ],
    }

    const result = await sendRequest(request)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      cookies: {
        foo: 'bar',
        another: 'cookie',
      },
    })
  })

  it('sends requests through a proxy', async () => {
    const proxyPort = createApiClientProxyOnAnyPort()
    const echoPort = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${echoPort}`,
    }

    const result = await sendRequest(request, `http://127.0.0.1:${proxyPort}`)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  it('keeps the trailing slash', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}/v1/`,
    }

    const result = await sendRequest(request)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      method: 'GET',
      path: '/v1/',
    })
  })
})
