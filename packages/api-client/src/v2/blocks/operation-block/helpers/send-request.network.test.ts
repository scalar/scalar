// @vitest-environment node
import { once } from 'node:events'
import { createServer } from 'node:http'

import { describe, expect, it } from 'vitest'

import { sendRequest } from './send-request'

describe('send-request.network', () => {
  it('preserves a real HTTP 600 response and its body', async () => {
    const body = JSON.stringify({ code: 600, message: 'application status' })
    const server = createServer((_request, response) => {
      response.writeHead(600, 'Application Status', { 'content-type': 'application/json' })
      response.end(body)
    })

    try {
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a local TCP address')
      }
      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [`http://127.0.0.1:${address.port}/custom-status`, {}],
      })

      expect(error).toBeNull()
      if (!result || !('data' in result.response)) {
        throw new Error('Expected a buffered response')
      }
      expect(result.response.status).toBe(600)
      expect(result.response.statusText).toBe('Application Status')
      expect(result.response.data).toBe(body)
      expect(result.response.size).toBe(Buffer.byteLength(body))
      const completedResponse = result.originalResponse.clone()
      expect(completedResponse.status).toBe(600)
      expect(completedResponse.ok).toBe(false)
      expect(await completedResponse.text()).toBe(body)
    } finally {
      server.closeAllConnections()
      if (server.listening) {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
        })
      }
    }
    expect(server.listening).toBe(false)
  })
})
