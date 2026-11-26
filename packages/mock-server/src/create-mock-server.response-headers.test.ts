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
  it('sends OpenAPI 3.2 examples in the header wire format', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.2.0',
        info: { title: 'Response headers', version: '1' },
        components: {
          schemas: { Message: { type: 'string' } },
          examples: { label: { serializedValue: '"re\\u0061dy"', dataValue: 'ready' } },
          mediaTypes: { text: { examples: { authored: { dataValue: '[1,2]' } } } },
        },
        paths: {
          '/': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  headers: {
                    'X-Label': {
                      content: {
                        'application/json': { examples: { authored: { $ref: '#/components/examples/label' } } },
                      },
                    },
                    'X-Count': {
                      schema: { type: 'integer', example: 1 },
                      examples: { authored: { dataValue: 42 } },
                    },
                    'X-Metadata': {
                      content: { 'application/json': { example: { id: 7, label: '東京🗼' } } },
                    },
                    'X-Text': {
                      content: { 'application/json': { $ref: '#/components/mediaTypes/text' } },
                    },
                    'X-Message': {
                      content: {
                        'application/xml': {
                          schema: { $ref: '#/components/schemas/Message' },
                          examples: { authored: { dataValue: '<hello/>\n東京🗼' } },
                        },
                      },
                    },
                    Link: {
                      content: {
                        'application/linkset': {
                          examples: {
                            authored: {
                              dataValue: { linkset: [{ anchor: '/items', next: [{ href: '/items?page=2' }] }] },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const response = await app.request('/')

    expect(response.headers.get('x-label')).toBe('"re\\u0061dy"')
    expect(response.headers.get('x-count')).toBe('42')
    expect(response.headers.get('x-metadata')).toBe('{"id":7,"label":"\\u6771\\u4eac\\ud83d\\uddfc"}')
    expect(response.headers.get('x-text')).toBe('"[1,2]"')
    expect(response.headers.get('x-message')).toBe('<Message>&lt;hello/&gt;&#10;&#26481;&#20140;&#128508;</Message>')
    expect(response.headers.get('link')).toBe('</items?page=2>; rel="next"; anchor="/items"')
  })

  it.each([
    {
      name: 'serialized cookie lines',
      openapi: '3.2.0',
      header: { content: { 'text/plain': { examples: { authored: { serializedValue: 'lang=en-US\r\nfoo=bar\n' } } } } },
      expected: ['lang=en-US', 'foo=bar'],
    },
    {
      name: 'structured cookies with an Expires attribute',
      openapi: '3.2.0',
      header: {
        schema: { type: 'object' },
        style: 'simple',
        explode: true,
        examples: {
          authored: { dataValue: { lang: 'en-US; Expires=Wed, 09 Jun 2021 10:18:14 GMT', foo: 'bar' } },
        },
      },
      expected: ['lang=en-US; Expires=Wed, 09 Jun 2021 10:18:14 GMT', 'foo=bar'],
    },
    {
      name: 'invalid serialized cookie fields',
      openapi: '3.2.0',
      header: {
        content: { 'text/plain': { examples: { authored: { serializedValue: 'lang=en-US\nfoo=bad\rvalue' } } } },
      },
      expected: [],
    },
    {
      name: 'a line feed inside structured cookie data',
      openapi: '3.2.0',
      header: {
        schema: { type: 'object' },
        explode: true,
        examples: { authored: { dataValue: { lang: 'en-US', foo: 'bar\nbaz' } } },
      },
      expected: [],
    },
    {
      name: 'a multiline example in OpenAPI 3.1',
      openapi: '3.1.2',
      header: { content: { 'text/plain': { example: 'lang=en-US\nfoo=bar' } } },
      expected: [],
    },
  ])('validates and serializes $name', async ({ openapi, header, expected }) => {
    const app = await createMockServer({
      document: {
        openapi,
        info: { title: 'Response cookies', version: '1' },
        paths: {
          '/': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  headers: { 'Set-Cookie': header },
                },
              },
            },
          },
        },
      },
    })

    const response = await app.request('/')

    expect(response.headers.getSetCookie()).toStrictEqual(expected)
  })

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
