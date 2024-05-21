import { encode } from 'punycode'
import { describe, expect, it } from 'vitest'

import { sendRequest } from './sendRequest'

const PROXY_PORT = 5051
const ECHO_PORT = 5052

function createProxyRequest({ url }: { url?: string }) {
  return {
    url: `http://127.0.0.1:${PROXY_PORT}?scalar_url=${encodeURI(url ?? '')}`,
  }
}

describe('sendRequest', () => {
  it('shows a warning when scalar_url is missing', async () => {
    const request = {
      url: `http://127.0.0.1:${PROXY_PORT}`,
    }

    const result = await sendRequest(request)

    expect(result?.response.data).toContain(
      'The `scalar_url` query parameter is required.',
    )
  })

  it('reaches the echo server *without* the proxy', async () => {
    const request = {
      url: `http://127.0.0.1:${ECHO_PORT}`,
    }

    const result = await sendRequest(request)

    expect(result?.response.data).not.toContain('ECONNREFUSED')
    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  it('reaches the echo server *with* the proxy', async () => {
    const request = createProxyRequest({
      url: `http://localhost:${ECHO_PORT}`,
    })

    const result = await sendRequest(request)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  it('replaces variables', async () => {
    const request = {
      url: `http://127.0.0.1:${ECHO_PORT}`,
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
    const request = {
      url: `http://127.0.0.1:${ECHO_PORT}`,
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
    const request = {
      url: `http://127.0.0.1:${ECHO_PORT}?example=parameter`,
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
    const request = {
      url: `http://127.0.0.1:${ECHO_PORT}`,
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
    const request = {
      url: `http://127.0.0.1:${ECHO_PORT}`,
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
    const request = {
      url: `http://127.0.0.1:${ECHO_PORT}/v1`,
    }

    const result = await sendRequest(request, `http://127.0.0.1:${PROXY_PORT}`)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      method: 'GET',
      path: '/v1',
    })
  })

  it('keeps the trailing slash', async () => {
    const request = {
      url: `http://127.0.0.1:${ECHO_PORT}/v1/`,
    }

    const result = await sendRequest(request)

    expect(JSON.parse(result?.response.data ?? '')).toMatchObject({
      method: 'GET',
      path: '/v1/',
    })
  })
})
