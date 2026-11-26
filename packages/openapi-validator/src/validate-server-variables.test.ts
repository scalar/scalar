import { describe, expect, it } from 'vitest'

import { validate } from './validate'
import { validateServerVariables } from './validate-server-variables'

const server = { url: 'https://example.com/{var}', variables: { var: { enum: ['a'], default: 'b' } } }
const message = 'Server variable "var" default must be one of its enum values.'

describe('validate-server-variables', () => {
  it.each(['3.1', '3.2'] as const)('rejects defaults outside the enum in %s and honors throwOnError', (version) => {
    const document = { openapi: `${version}.0`, info: { title: 'API', version: '1' }, paths: {}, servers: [server] }
    const result = validate(document)
    expect(result.valid).toBe(false)
    expect(result.errors).toStrictEqual([{ path: '/servers/0/variables/var/default', message }])
    expect(() => validate(document, { throwOnError: true })).toThrow(message)
  })

  it('preserves OpenAPI 3.0 recommendation-only behavior', () => {
    const result = validate({ openapi: '3.0.4', info: { title: 'API', version: '1' }, paths: {}, servers: [server] })
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
  })

  it('accepts matching defaults, empty strings and unconstrained variables', () => {
    const result = validate({
      openapi: '3.1.0',
      info: { title: 'API', version: '1' },
      paths: {},
      servers: [
        {
          url: 'https://{host}/{path}/{open}',
          variables: {
            host: { enum: ['example.com', 'localhost'], default: 'localhost' },
            path: { enum: [''], default: '' },
            open: { default: 'anything' },
          },
        },
      ],
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
  })

  it('compares values case-sensitively and escapes variable names in locations', () => {
    expect(
      validateServerVariables(
        {
          servers: [
            {
              url: '/',
              variables: {
                'x-a/~b': { enum: ['value'], default: 'VALUE' },
                other: { enum: ['a'], default: 'b' },
              },
            },
          ],
        },
        '3.1',
      ),
    ).toStrictEqual([
      {
        path: '/servers/0/variables/x-a~1~0b/default',
        message: 'Server variable "x-a/~b" default must be one of its enum values.',
      },
      {
        path: '/servers/0/variables/other/default',
        message: 'Server variable "other" default must be one of its enum values.',
      },
    ])
  })

  it.each([
    ['path', { paths: { '/test': { servers: [server] } } }, '/paths/~1test/servers/0'],
    ['operation', { paths: { '/test': { get: { servers: [server] } } } }, '/paths/~1test/get/servers/0'],
    ['webhook', { webhooks: { 'x-event': { post: { servers: [server] } } } }, '/webhooks/x-event/post/servers/0'],
    [
      'callback',
      { paths: { '/test': { get: { callbacks: { 'x-event': { '{$request.query.url}': { servers: [server] } } } } } } },
      '/paths/~1test/get/callbacks/x-event/{$request.query.url}/servers/0',
    ],
    [
      'response link',
      { paths: { '/test': { get: { responses: { '200': { links: { 'x-next': { server } } } } } } } },
      '/paths/~1test/get/responses/200/links/x-next/server',
    ],
    [
      'reusable path',
      { components: { pathItems: { Unused: { servers: [server] } } } },
      '/components/pathItems/Unused/servers/0',
    ],
    [
      'reusable callback',
      { components: { callbacks: { Unused: { '{$request.query.url}': { servers: [server] } } } } },
      '/components/callbacks/Unused/{$request.query.url}/servers/0',
    ],
    [
      'reusable response',
      { components: { responses: { Unused: { links: { next: { server } } } } } },
      '/components/responses/Unused/links/next/server',
    ],
    ['reusable link', { components: { links: { Unused: { server } } } }, '/components/links/Unused/server'],
  ] satisfies [string, Record<string, unknown>, string][])('checks the %s server location', (_name, document, path) => {
    expect(validateServerVariables(document, '3.1')).toStrictEqual([{ path: `${path}/variables/var/default`, message }])
  })

  it.each(['query', 'COPY'])('checks OpenAPI 3.2 %s operations', (method) => {
    const operation = { servers: [server] }
    const item = method === 'query' ? { query: operation } : { additionalOperations: { COPY: operation } }
    const path = method === 'query' ? '/paths/~1test/query' : '/paths/~1test/additionalOperations/COPY'
    const document = { paths: { '/test': item } }
    expect(validateServerVariables(document, '3.2')).toStrictEqual([
      { path: `${path}/servers/0/variables/var/default`, message },
    ])
    expect(validateServerVariables(document, '3.1')).toStrictEqual([])
  })

  it('follows local path, callback, response and link references without reporting reusable servers twice', () => {
    const document = {
      paths: { '/test': { $ref: '#/components/pathItems/Shared' } },
      components: {
        pathItems: { Shared: { get: { callbacks: { event: { $ref: '#/components/callbacks/Event' } } } } },
        callbacks: {
          Event: {
            '{$request.query.url}': { post: { responses: { '200': { $ref: '#/components/responses/Result' } } } },
          },
        },
        responses: { Result: { links: { next: { $ref: '#/components/links/Next' } } } },
        links: { Next: { operationId: 'read', server } },
      },
    }
    const original = structuredClone(document)
    expect(validateServerVariables(document, '3.1')).toStrictEqual([
      {
        path: '/paths/~1test/get/callbacks/event/{$request.query.url}/post/responses/200/links/next/server/variables/var/default',
        message,
      },
    ])
    expect(document).toStrictEqual(original)
  })

  it.each(['#/components/pathItems/Shared', 'external.yaml#/item'])(
    'preserves adjacent Path Item servers beside %s',
    ($ref) => {
      expect(
        validateServerVariables(
          { paths: { '/test': { $ref, servers: [server] } }, components: { pathItems: { Shared: {} } } },
          '3.1',
        ),
      ).toStrictEqual([{ path: '/paths/~1test/servers/0/variables/var/default', message }])
    },
  )

  it('ignores Reference Object siblings and unknown external targets', () => {
    expect(
      validateServerVariables(
        {
          paths: {
            '/test': {
              get: {
                responses: {
                  '200': {
                    links: {
                      external: { $ref: 'external.yaml#/link', server },
                      local: { $ref: '#/components/links/Valid', server },
                      missing: { $ref: '#/missing' },
                    },
                  },
                },
              },
            },
          },
          components: { links: { Valid: { operationId: 'read' } } },
        },
        '3.1',
      ),
    ).toStrictEqual([])
  })

  it('terminates recursive callbacks while checking other paths', () => {
    expect(
      validateServerVariables(
        {
          paths: {
            '/cycle': { get: { callbacks: { again: { '{$request.query.url}': { $ref: '#/paths/~1cycle' } } } } },
            '/test': { servers: [server] },
          },
        },
        '3.1',
      ),
    ).toStrictEqual([{ path: '/paths/~1test/servers/0/variables/var/default', message }])
  })

  it('ignores examples, schema defaults and extensions', () => {
    const data = { servers: [server], server }
    expect(
      validateServerVariables(
        {
          'x-data': data,
          paths: {
            'x-data': data,
            '/test': {
              'x-data': data,
              get: {
                'x-data': data,
                responses: {
                  'x-data': { links: { next: { server } } },
                  '200': { content: { 'application/json': { example: data } } },
                },
              },
            },
          },
          components: { schemas: { Data: { type: 'string', enum: ['a'], default: 'b', example: data } } },
        },
        '3.1',
      ),
    ).toStrictEqual([])
  })

  it('ignores server declarations for OpenAPI 2.0', () => {
    expect(validateServerVariables({ servers: [server] }, '2.0')).toStrictEqual([])
  })
})
