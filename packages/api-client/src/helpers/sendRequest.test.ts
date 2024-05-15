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
})
