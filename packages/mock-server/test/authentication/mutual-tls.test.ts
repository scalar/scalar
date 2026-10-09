import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import { createServer, request } from 'node:https'

import { serve } from '@hono/node-server'
import { describe, expect, it } from 'vitest'

import { createAsyncApiMockServer } from '../../src/create-asyncapi-mock-server'
import { createMockServer } from '../../src/create-mock-server'

const cert = readFileSync(new URL('../fixtures/tls/localhost.crt', import.meta.url))
const key = readFileSync(new URL('../fixtures/tls/localhost.key', import.meta.url))

const untrustedCert = readFileSync(new URL('../fixtures/tls/untrusted.crt', import.meta.url))
const untrustedKey = readFileSync(new URL('../fixtures/tls/untrusted.key', import.meta.url))

describe('mutual-tls', () => {
  it.each(['OpenAPI', 'AsyncAPI'])('requires a verified TLS client certificate for %s', async (format) => {
    const asyncServer =
      format === 'AsyncAPI'
        ? await createAsyncApiMockServer({
            document: {
              asyncapi: '3.0.0',
              info: { title: 'Certificates', version: '1' },
              servers: { events: { host: 'localhost', protocol: 'sse', security: [{ type: 'X509' }] } },
              channels: { events: { address: '/events', messages: { event: { payload: { const: 'hello' } } } } },
            },
          })
        : undefined
    const app =
      asyncServer?.app ??
      (await createMockServer({
        logger: false,
        document: {
          openapi: '3.1.0',
          info: { title: 'Certificates', version: '1' },
          components: { securitySchemes: { mtls: { type: 'mutualTLS' } } },
          security: [{ mtls: [] }],
          paths: { '/events': { get: { responses: { '200': { description: 'OK' } } } } },
        },
      }))
    const server = serve({
      fetch: app.fetch,
      createServer,
      hostname: '127.0.0.1',
      port: 0,
      serverOptions: { key, cert, ca: cert, requestCert: true, rejectUnauthorized: false },
    })
    try {
      if (!server.listening) await once(server, 'listening')
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('Expected TCP address')
      const get = (certificate: 'none' | 'trusted' | 'untrusted'): Promise<number | undefined> =>
        new Promise((resolve, reject) => {
          const req = request(
            {
              host: '127.0.0.1',
              port: address.port,
              path: '/events',
              ca: cert,
              agent: false,
              headers: { 'X-Client-Cert': cert.toString().replace(/\n/g, '') },
              ...(certificate === 'trusted'
                ? { key, cert }
                : certificate === 'untrusted'
                  ? { key: untrustedKey, cert: untrustedCert }
                  : {}),
            },
            (response) => {
              response.resume()
              response.on('end', () => resolve(response.statusCode))
            },
          )
          req.on('error', reject)
          req.end()
        })
      expect(await get('none')).toBe(401)
      expect(await get('trusted')).toBe(200)
      expect(await get('untrusted')).toBe(401)
      expect((await app.request('/events', { headers: { 'X-Client-Cert': 'spoofed' } })).status).toBe(401)
    } finally {
      if ('closeAllConnections' in server) server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
      asyncServer?.websocket.server.close()
    }
  })
})
