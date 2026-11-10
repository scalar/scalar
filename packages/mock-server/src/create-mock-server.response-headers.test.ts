import { once } from 'node:events'
import { createServer } from 'node:http'

import { getRequestListener } from '@hono/node-server'
import { describe, expect, it } from 'vitest'

import { createMockServer } from './create-mock-server'

const jsonContent = {
  'application/json': {
    schema: { type: 'object', properties: { name: { type: 'string', example: 'café' } } },
  },
}
const length = { 'Content-Length': { schema: { type: 'integer', example: 3 } } }
const transfer = { 'tRaNsFeR-EnCoDiNg': { schema: { type: 'string', example: 'gzip' } } }
const trailer = { Trailer: { schema: { type: 'string', example: 'X-Checksum' } } }
const encoding = { 'Content-Encoding': { schema: { type: 'string', enum: ['gzip', 'br'] } } }

type ResponseCase = {
  name: string
  headers: Record<string, unknown>
  content?: Record<string, unknown>
  body?: string
  contentType?: string | null
  status?: number
  absentHeader?: string
  openapi?: string
}

const cases: ResponseCase[] = [
  { name: 'transfer encoding', headers: transfer, absentHeader: 'transfer-encoding' },
  { name: 'trailer', headers: trailer, absentHeader: 'trailer' },
  ...['Connection', 'Keep-Alive', 'Upgrade', 'TE', 'Proxy-Connection'].map(
    (header): ResponseCase => ({
      name: header,
      headers: { [header]: { schema: { type: 'string', example: 'invalid-transport-setting' } } },
    }),
  ),
  ...['bad\r\nvalue', 'bad\0value', 'bad\x01value', 'snowman ☃'].map(
    (example): ResponseCase => ({
      name: `malformed value ${JSON.stringify(example)}`,
      headers: { 'X-Invalid': { schema: { type: 'string', example } } },
      absentHeader: 'x-invalid',
    }),
  ),
  { name: 'malformed name', headers: { 'Bad Name': { schema: { type: 'string', example: 'value' } } } },
  { name: 'generated length', headers: { 'Content-Length': { schema: { type: 'integer' } } } },
  { name: 'short length', headers: length },
  { name: 'long length', headers: { 'content-length': { schema: { type: 'integer', example: 1024 } } } },
  { name: 'gzip encoding', headers: encoding },
  { name: 'brotli encoding', headers: { 'content-encoding': { schema: { type: 'string', const: 'br' } } } },
  { name: 'referenced mixed-case length', headers: { 'cOnTeNt-LeNgTh': { $ref: '#/components/headers/Length' } } },
  {
    name: 'XML',
    headers: { ...length, ...encoding },
    content: { 'application/xml': { example: '<name>café</name>' } },
    body: '<name>café</name>',
    contentType: 'application/xml',
  },
  ...[length, encoding, transfer, trailer].map(
    (headers, index): ResponseCase => ({
      name: `SSE with declared ${['length', 'encoding', 'transfer encoding', 'trailer'][index]}`,
      headers,
      content: { 'text/event-stream': { example: [{ id: 1 }, { id: 2 }] } },
      body: 'data: {"id":1}\n\ndata: {"id":2}\n\n',
      contentType: 'text/event-stream',
    }),
  ),
  ...[length, encoding, transfer, trailer].map(
    (headers, index): ResponseCase => ({
      name: `NDJSON with declared ${['length', 'encoding', 'transfer encoding', 'trailer'][index]}`,
      headers,
      openapi: '3.2.0',
      content: { 'application/x-ndjson': { itemSchema: { type: 'object', properties: { id: { const: 1 } } } } },
      body: '{"id":1}\n{"id":1}\n{"id":1}\n',
      contentType: 'application/x-ndjson',
    }),
  ),
  { name: 'empty 200', headers: { ...length, ...encoding }, content: {}, body: '', contentType: null },
  { name: '204', headers: { ...length, ...encoding }, status: 204, body: '', contentType: null },
]

describe('create-mock-server.response-headers', () => {
  it.each(cases)('sends a readable HTTP response for $name', async (testCase) => {
    const app = await createMockServer({
      logger: false,
      document: {
        openapi: testCase.openapi ?? '3.1.0',
        info: { title: 'Response headers', version: '1' },
        components: { headers: { Length: { schema: { type: 'integer', example: 3 } } } },
        paths: {
          '/file': {
            get: {
              responses: {
                [testCase.status ?? 200]: {
                  description: 'OK',
                  headers: {
                    ...testCase.headers,
                    'cOnTeNt-TyPe': { schema: { type: 'string', const: 'text/plain' } },
                    'X-Custom': { schema: { type: 'string', const: 'preserved' } },
                  },
                  content: testCase.content ?? jsonContent,
                },
              },
            },
          },
        },
      },
    })
    // In-memory requests do not exercise HTTP framing or automatic decompression.
    const server = createServer(getRequestListener(app.fetch))
    try {
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP address')
      }
      const response = await fetch(`http://127.0.0.1:${address.port}/file`, { signal: AbortSignal.timeout(2000) })
      const body = await response.text()

      expect(response.status).toBe(testCase.status ?? 200)
      expect(body).toBe(testCase.body ?? '{"name":"café"}')
      if (testCase.absentHeader) {
        expect(response.headers.get(testCase.absentHeader)).toBeNull()
      }
      expect(response.headers.get('trailer')).toBeNull()
      expect(response.headers.get('upgrade')).toBeNull()
      expect(response.headers.get('te')).toBeNull()
      expect(response.headers.get('proxy-connection')).toBeNull()
      expect(response.headers.get('connection')).not.toBe('invalid-transport-setting')
      expect(response.headers.get('keep-alive')).not.toBe('invalid-transport-setting')
      expect(response.headers.get('content-encoding')).toBeNull()
      expect(response.headers.get('content-type')).toBe(
        testCase.contentType === undefined ? 'application/json' : testCase.contentType,
      )
      expect(response.headers.get('x-custom')).toBe('preserved')
      expect(response.headers.get('access-control-allow-origin')).toBe('*')
      if (response.status === 204 || response.headers.has('transfer-encoding')) {
        expect(response.headers.get('content-length')).toBeNull()
      } else if (response.headers.has('content-length')) {
        expect(response.headers.get('content-length')).toBe(String(Buffer.byteLength(body)))
      }
    } finally {
      const closed = once(server, 'close')
      server.close()
      server.closeAllConnections()
      await closed
    }
  })
})
