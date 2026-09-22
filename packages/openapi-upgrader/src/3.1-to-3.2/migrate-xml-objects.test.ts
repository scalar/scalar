import { describe, expect, it } from 'vitest'

import { upgradeFromThreeOneToThreeTwo } from './upgrade-from-three-one-to-three-two'

const payload = { xml: { wrapped: true, attribute: true }, nested: [{ xml: { wrapped: true } }] }

const document = (fields: Record<string, unknown>): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: { title: 'API', version: '1.0.0' },
  paths: {},
  ...fields,
})

describe('migrate-xml-objects', () => {
  it.each([
    ['schema example', { components: { schemas: { Data: { example: payload } } } }],
    ['schema examples', { components: { schemas: { Data: { examples: [payload] } } } }],
    ['schema default', { components: { schemas: { Data: { default: payload } } } }],
    ['schema const', { components: { schemas: { Data: { const: payload } } } }],
    ['schema enum', { components: { schemas: { Data: { enum: [payload] } } } }],
    ['schema extension', { components: { schemas: { Data: { 'x-data': payload } } } }],
    ['document extension', { 'x-data': { schema: payload } }],
    ['reusable example', { components: { examples: { schema: { value: payload } } } }],
    ['parameter example', { components: { parameters: { data: { name: 'data', in: 'query', example: payload } } } }],
    ['header examples', { components: { headers: { Data: { examples: { sample: { value: payload } } } } } }],
    [
      'media example',
      {
        components: {
          responses: { Data: { description: 'OK', content: { 'application/json': { example: payload } } } },
        },
      },
    ],
    [
      'media examples',
      {
        components: {
          requestBodies: { Data: { content: { 'application/json': { examples: { sample: { value: payload } } } } } },
        },
      },
    ],
    ['path extension', { paths: { 'x-data': { get: { parameters: [{ schema: payload }] } } } }],
    [
      'response extension',
      {
        paths: {
          '/data': { get: { responses: { 'x-data': { content: { 'application/json': { schema: payload } } } } } },
        },
      },
    ],
  ])('preserves %s data without throwing', (_name, fields) => {
    const input = document(structuredClone(fields))
    const expected = { ...structuredClone(input), openapi: '3.2.0' }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual(expected)
  })

  it('preserves ordinary xml values in a response example', () => {
    const input = document({
      paths: {
        '/data': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    example: [{ xml: { wrapped: true } }, { xml: { attribute: true } }],
                  },
                },
              },
            },
          },
        },
      },
    })
    const expected = { ...structuredClone(input), openapi: '3.2.0' }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual(expected)
  })

  it.each(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'])(
    'migrates schemas in %s without treating member names as keywords',
    (keyword) => {
      const input = document({
        components: {
          schemas: {
            Data: {
              [keyword]: {
                xml: { type: 'string', xml: { attribute: true } },
                examples: { type: 'array', xml: { wrapped: true } },
                'x-data': { type: 'string', xml: { attribute: true } },
              },
            },
          },
        },
      })

      expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual({
        ...document({
          components: {
            schemas: {
              Data: {
                [keyword]: {
                  xml: { type: 'string', xml: { nodeType: 'attribute' } },
                  examples: { type: 'array', xml: { nodeType: 'element' } },
                  'x-data': { type: 'string', xml: { nodeType: 'attribute' } },
                },
              },
            },
          },
        }),
        openapi: '3.2.0',
      })
    },
  )

  it.each(['allOf', 'anyOf', 'oneOf', 'prefixItems'])('migrates schemas in %s arrays', (keyword) => {
    const input = document({
      components: {
        schemas: {
          Data: {
            [keyword]: [true, false, { type: 'string', xml: { attribute: true }, examples: [payload] }],
          },
        },
      },
    })

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual({
      ...document({
        components: {
          schemas: {
            Data: { [keyword]: [true, false, { type: 'string', xml: { nodeType: 'attribute' }, examples: [payload] }] },
          },
        },
      }),
      openapi: '3.2.0',
    })
  })

  it.each([
    'items',
    'contains',
    'additionalProperties',
    'unevaluatedProperties',
    'unevaluatedItems',
    'propertyNames',
    'not',
    'if',
    'then',
    'else',
    'contentSchema',
  ])('migrates nested schemas under %s', (keyword) => {
    const input = document({
      components: {
        schemas: {
          Data: {
            [keyword]: { type: 'string', xml: { attribute: true }, default: payload },
          },
        },
      },
    })

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual({
      ...document({
        components: {
          schemas: {
            Data: {
              [keyword]: {
                type: 'string',
                xml: { nodeType: 'attribute' },
                default: payload,
              },
            },
          },
        },
      }),
      openapi: '3.2.0',
    })
  })

  it('migrates schemas in callbacks, webhooks, headers, and inline operations', () => {
    const buildDocument = (xml: Record<string, unknown>): Record<string, unknown> => {
      const schema = { type: 'string', xml }
      const pathItem = {
        parameters: [{ name: 'id', in: 'query', schema }],
        post: {
          requestBody: {
            content: {
              'application/xml': {
                schema,
                encoding: { 'x-field': { headers: { 'x-header': { schema } } } },
              },
            },
          },
          responses: {
            '200': {
              description: 'OK',
              headers: { 'x-header': { schema } },
              content: { 'application/xml': { schema } },
            },
          },
        },
      }
      return document({
        paths: { '/data': { ...pathItem, get: { callbacks: { event: { '{$request.query.url}': pathItem } } } } },
        webhooks: { 'x-event': pathItem },
        components: {
          pathItems: { reusable: pathItem },
          callbacks: { event: { '{$request.query.url}': pathItem } },
          schemas: { xml: schema, empty: true },
          parameters: { reusable: { name: 'id', in: 'query', schema } },
          headers: { 'x-header': { schema } },
        },
      })
    }
    // JSON parsing gives each occurrence its own object so every route must be visited.
    const input = JSON.parse(JSON.stringify(buildDocument({ attribute: true })))
    const expected = { ...buildDocument({ nodeType: 'attribute' }), openapi: '3.2.0' }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual(expected)
  })
  it('migrates recursive bundled references only in their OpenAPI context', () => {
    const build = (xml: Record<string, unknown>): Record<string, unknown> =>
      document({
        components: {
          schemas: { Pet: { $ref: '#/x-ext/pet~1schema' } },
          responses: { Pet: { $ref: '#/x-ext/response' } },
          callbacks: { Event: { $ref: '#/x-ext/callback' } },
          examples: { Sample: { $ref: '#/x-ext/example' } },
        },
        'x-ext': {
          'pet/schema': {
            properties: { id: { type: 'string', xml }, friend: { $ref: '#/x-ext/pet~1schema' } },
            examples: [payload],
          },
          response: { content: { 'application/xml': { schema: { type: 'string', xml } } } },
          callback: { '{$request.query.url}': { post: { parameters: [{ schema: { type: 'string', xml } }] } } },
          example: { value: payload },
          untouched: payload,
        },
      })

    expect(upgradeFromThreeOneToThreeTwo(build({ attribute: true }))).toStrictEqual({
      ...build({ nodeType: 'attribute' }),
      openapi: '3.2.0',
    })
  })
})
