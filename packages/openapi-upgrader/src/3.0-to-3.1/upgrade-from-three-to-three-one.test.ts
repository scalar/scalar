import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { upgradeFromThreeToThreeOne } from './upgrade-from-three-to-three-one'

describe('upgradeFromThreeToThreeOne', () => {
  it.each(['oneOf', 'anyOf'])('migrates an untyped nullable %s to an explicit null union', (keyword) => {
    const branches = [{ type: 'string' }, { type: 'integer' }]
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.3',
      info: { title: 'Nullable unions', version: '1' },
      paths: {},
      components: {
        schemas: {
          Value: { nullable: true, [keyword]: branches, readOnly: true, enum: ['a'], description: 'A value' },
        },
      },
    })

    expect(result.components?.schemas?.Value).toStrictEqual({
      readOnly: true,
      enum: ['a'],
      description: 'A value',
      anyOf: [{ [keyword]: branches }, { type: 'null' }],
    })
  })

  it.each(['allOf', 'anyOf', 'oneOf', '$ref'] as const)(
    'migrates sibling bounds and examples on a nullable %s',
    (keyword) => {
      const reference = { $ref: '#/components/schemas/Number' }
      const composition = keyword === '$ref' ? reference : { [keyword]: [reference] }
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.4',
        info: { title: 'Nullable bounds', version: '1' },
        paths: {},
        components: {
          schemas: {
            Number: { type: 'number' },
            Value: {
              nullable: true,
              ...composition,
              minimum: 0,
              maximum: 10,
              exclusiveMinimum: true,
              exclusiveMaximum: true,
              example: 1,
            },
          },
        },
      })

      expect(result.components?.schemas?.Value).toStrictEqual({
        exclusiveMinimum: 0,
        exclusiveMaximum: 10,
        examples: [1],
        anyOf: [keyword === '$ref' || keyword === 'allOf' ? reference : composition, { type: 'null' }],
      })
    },
  )

  it('preserves schema-like payloads in extensions outside schemas', () => {
    const extension = {
      schema: { nullable: true, oneOf: [{ type: 'number' }], minimum: 0, exclusiveMinimum: true, example: 1 },
    }
    const document = {
      openapi: '3.0.4',
      info: { title: 'Extension data', version: '1', 'x-metadata': extension },
      'x-metadata': extension,
      paths: {
        '/records': {
          'x-metadata': extension,
          get: {
            'x-metadata': extension,
            parameters: [{ name: 'filter', in: 'query', schema: { type: 'string' }, 'x-metadata': extension }],
            responses: { '200': { description: 'OK', 'x-metadata': extension } },
          },
        },
      },
    }
    const before = structuredClone(document)

    expect(upgradeFromThreeToThreeOne(document)).toStrictEqual({ ...before, openapi: '3.1.1' })
  })

  it('preserves every composition when adding the null alternative', () => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.3',
      info: { title: 'Nullable compositions', version: '1' },
      paths: {},
      components: {
        schemas: {
          Value: {
            nullable: true,
            allOf: [{ minLength: 1 }],
            anyOf: [{ type: 'string' }, { type: 'integer' }],
            oneOf: [{ type: 'string', nullable: true }, { type: 'integer' }],
          },
        },
      },
    })

    expect(result.components?.schemas?.Value).toStrictEqual({
      anyOf: [
        {
          allOf: [{ minLength: 1 }],
          anyOf: [{ type: 'string' }, { type: 'integer' }],
          oneOf: [{ type: ['string', 'null'] }, { type: 'integer' }],
        },
        { type: 'null' },
      ],
    })
  })

  it.each(['#/x-ext/value', '#%2Fx-ext%2Fvalue'])('migrates a bundled standalone nullable schema at %s', (ref) => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.3',
      info: { title: 'External schemas', version: '1' },
      paths: {},
      components: { schemas: { Value: { $ref: ref } } },
      'x-ext': { value: { nullable: true, oneOf: [{ type: 'string' }, { type: 'integer' }] } },
    })

    expect(result).toStrictEqual({
      openapi: '3.1.1',
      info: { title: 'External schemas', version: '1' },
      paths: {},
      components: { schemas: { Value: { $ref: ref } } },
      'x-ext': { value: { anyOf: [{ oneOf: [{ type: 'string' }, { type: 'integer' }] }, { type: 'null' }] } },
    })
  })

  it('preserves unreferenced x-ext data even when it contains schema-like field names', () => {
    const metadata = {
      schema: { nullable: true, oneOf: [{ type: 'string' }], minimum: 0, exclusiveMinimum: true, example: 1 },
    }
    const before = structuredClone(metadata)
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Extension data', version: '1' },
      paths: {},
      'x-ext': { metadata },
    })

    expect(result['x-ext']).toStrictEqual({ metadata: before })
  })

  it.each([
    { openapi: '3.0.4', schema: { nullable: true, oneOf: [{ type: 'string' }] } },
    {
      openapi: '3.0.4',
      info: { title: 'Copied description', version: '1' },
      paths: {},
      components: { schemas: { Value: { nullable: true, oneOf: [{ type: 'string' }] } } },
    },
  ])('preserves unreferenced x-ext data containing version fields: %j', (metadata) => {
    const before = structuredClone(metadata)
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Extension data', version: '1' },
      paths: {},
      'x-ext': { metadata },
    })

    expect(result['x-ext']).toStrictEqual({ metadata: before })
  })

  it('converts only referenced fragments in an otherwise untyped external resource', () => {
    const schema = { nullable: true, oneOf: [{ type: 'string' }] }
    const metadata = { schema }
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Fragments', version: '1' },
      paths: {},
      components: { schemas: { Value: { $ref: '#/x-ext/storage/Value' } } },
      'x-ext': { storage: { Value: schema, metadata } },
    })

    expect(result['x-ext']).toStrictEqual({
      storage: { Value: { anyOf: [{ oneOf: [{ type: 'string' }] }, { type: 'null' }] }, metadata },
    })
  })

  it('preserves literal data inside a referenced standalone Example Object', () => {
    const example = { value: { schema: { nullable: true, oneOf: [{ type: 'string' }] } } }
    const before = structuredClone(example)
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Examples', version: '1' },
      paths: {},
      components: { examples: { Sample: { $ref: '#/x-ext/example' } } },
      'x-ext': { example },
    })

    expect(result['x-ext']).toStrictEqual({ example: before })
  })

  it('keeps a referenced standalone schema independent of its consuming union arm', () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Standalone schema', version: '1' },
      paths: {},
      components: { schemas: { Value: { oneOf: [{ $ref: '#/x-ext/untyped' }, { type: 'string' }] } } },
      'x-ext': { untyped: { nullable: true } },
    })

    expect(result['x-ext']).toStrictEqual({ untyped: {} })
  })

  it('migrates a schema stored directly in x-ext when an actual schema reference targets it', () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Schema extension', version: '1' },
      paths: {},
      components: { schemas: { Value: { $ref: '#/x-ext' } } },
      'x-ext': { nullable: true, oneOf: [{ type: 'string' }] },
    })

    expect(result['x-ext']).toStrictEqual({ anyOf: [{ oneOf: [{ type: 'string' }] }, { type: 'null' }] })
  })

  it.each(['external', 'default', 'example', 'x-name'])(
    'preserves nullable-named components in bundled document %s',
    (resource) => {
      const parameter = { name: 'limit', in: 'query', required: true, schema: { type: 'integer', nullable: true } }
      const response = {
        description: 'OK',
        content: { 'application/json': { schema: { type: 'string', nullable: true } } },
      }
      const result = upgradeFromThreeToThreeOne({
        openapi: '3.0.4',
        info: { title: 'Bundled components', version: '1' },
        paths: {},
        components: {
          parameters: { Limit: { $ref: `#/x-ext/${resource}/components/parameters/nullable` } },
          responses: { Success: { $ref: `#/x-ext/${resource}/components/responses/nullable` } },
        },
        'x-ext': {
          [resource]: {
            openapi: '3.0.4',
            info: { title: 'Shared', version: '1' },
            paths: {},
            components: { parameters: { nullable: parameter }, responses: { nullable: response } },
          },
        },
      })

      expect(result['x-ext']).toStrictEqual({
        [resource]: {
          openapi: '3.0.4',
          info: { title: 'Shared', version: '1' },
          paths: {},
          components: {
            parameters: { nullable: { ...parameter, schema: { type: ['integer', 'null'] } } },
            responses: {
              nullable: {
                description: 'OK',
                content: { 'application/json': { schema: { type: ['string', 'null'] } } },
              },
            },
          },
        },
      })
    },
  )

  it('follows schema references across standalone resources without rewriting unrelated fragments', () => {
    const data = { nullable: true, oneOf: [{ type: 'string' }] }
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Bundled schema references', version: '1' },
      paths: {},
      components: { schemas: { Value: { $ref: '#/x-ext/alias' } } },
      'x-ext': {
        value: data,
        alias: { $ref: '#/x-ext/value' },
        example: data,
      },
    })

    expect(result['x-ext']).toStrictEqual({
      value: { anyOf: [{ oneOf: [{ type: 'string' }] }, { type: 'null' }] },
      alias: { $ref: '#/x-ext/value' },
      example: data,
    })
  })

  it('preserves specification extensions directly inside the Paths Object', () => {
    const metadata = { schema: { nullable: true, oneOf: [{ type: 'string' }] } }
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Path extensions', version: '1' },
      paths: {
        'x-metadata': metadata,
        '/records': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/json': { schema: { type: 'string', nullable: true } } },
              },
            },
          },
        },
      },
    })

    expect(result.paths).toStrictEqual({
      'x-metadata': metadata,
      '/records': {
        get: {
          responses: {
            '200': { description: 'OK', content: { 'application/json': { schema: { type: ['string', 'null'] } } } },
          },
        },
      },
    })
  })

  it.each([
    [{ nullable: true }, {}],
    [{ nullable: false }, {}],
    [{ nullable: true, enum: ['a'] }, { enum: ['a'] }],
    [{ nullable: false, type: 'string' }, { type: 'string' }],
    [
      { nullable: false, oneOf: [{ type: 'string' }, { type: 'integer' }] },
      { oneOf: [{ type: 'string' }, { type: 'integer' }] },
    ],
  ])('removes an ineffective nullable from %j', (schema, expected) => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.3',
      info: { title: 'Nullable cleanup', version: '1' },
      paths: {},
      components: { schemas: { Value: schema } },
    })

    expect(result.components?.schemas?.Value).toStrictEqual(expected)
  })

  it('preserves nullable property names, examples, defaults, enum values, and extension payloads', () => {
    const value = { nullable: true, oneOf: [{ type: 'string' }, { type: 'integer' }] }
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.3',
      info: { title: 'Nullable data', version: '1' },
      paths: {},
      components: {
        schemas: {
          nullable: {
            type: 'object',
            properties: { nullable: value },
            default: value,
            enum: [value],
            example: value,
            'x-metadata': value,
          },
        },
      },
    })

    expect(result.components?.schemas?.nullable).toStrictEqual({
      type: 'object',
      properties: { nullable: { anyOf: [{ oneOf: value.oneOf }, { type: 'null' }] } },
      default: value,
      enum: [value],
      examples: [value],
      'x-metadata': value,
    })
  })

  it.each(['3.1.0', '3.2.0'])('preserves a bundled description that declares OpenAPI %s', (openapi) => {
    const resource = {
      openapi,
      info: { title: 'Native schemas', version: '1' },
      paths: {},
      components: { schemas: { Value: { nullable: true, oneOf: [{ type: 'string' }] } } },
    }
    const before = structuredClone(resource)
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Legacy root', version: '1' },
      paths: {},
      components: { schemas: { Value: { $ref: '#/x-ext/native/components/schemas/Value' } } },
      'x-ext': { native: resource },
    })

    expect(result['x-ext']).toStrictEqual({ native: before })
  })

  it('preserves a bundled standalone schema with its own dialect', () => {
    const resource = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      nullable: true,
      oneOf: [{ type: 'string' }],
    }
    const before = structuredClone(resource)
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Legacy root', version: '1' },
      paths: {},
      components: { schemas: { Value: { $ref: '#/x-ext/native' } } },
      'x-ext': { native: resource },
    })

    expect(result['x-ext']).toStrictEqual({ native: before })
  })

  it.each(['oneOf', 'anyOf'] as const)('preserves local references into relocated nullable %s members', (keyword) => {
    const ref = `#/components/schemas/Value~1Kind/${keyword}/0`
    const literal = { $ref: ref }
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Union references', version: '1' },
      paths: {},
      components: {
        schemas: {
          'Value/Kind': { nullable: true, [keyword]: [{ type: 'string' }, { type: 'integer' }] },
          Alias: { $ref: ref },
          Annotated: { type: 'object', example: literal, default: literal, 'x-metadata': literal },
        },
      },
    })

    expect(result.components?.schemas?.Alias).toStrictEqual({
      $ref: `#/components/schemas/Value~1Kind/anyOf/0/${keyword}/0`,
    })
    expect(result.components?.schemas?.Annotated).toStrictEqual({
      type: 'object',
      examples: [literal],
      default: literal,
      'x-metadata': literal,
    })
  })

  it('relocates URI-encoded pointers without decoding literal percent sequences twice', () => {
    const ref = `#${encodeURIComponent('/components/schemas/Value%2F/oneOf/0')}`
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Encoded union references', version: '1' },
      paths: {},
      components: {
        schemas: {
          'Value%2F': { nullable: true, oneOf: [{ type: 'string' }] },
          Alias: { $ref: ref },
        },
      },
    })

    expect(result.components?.schemas?.Alias).toStrictEqual({
      $ref: '#/components/schemas/Value%252F/anyOf/0/oneOf/0',
    })
  })

  it('composes reference relocations through nested nullable compositions', () => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Nested union references', version: '1' },
      paths: {},
      components: {
        schemas: {
          Value: { nullable: true, allOf: [{ nullable: true, oneOf: [{ type: 'string' }] }] },
          Alias: { $ref: '#/components/schemas/Value/allOf/0/oneOf/0' },
        },
      },
    })

    expect(result.components?.schemas?.Alias).toStrictEqual({
      $ref: '#/components/schemas/Value/anyOf/0/anyOf/0/oneOf/0',
    })
  })

  it.each(['3.1.0', '3.2.0'])('leaves legacy nullable in an OpenAPI %s document unchanged', (openapi) => {
    const document = {
      openapi,
      info: { title: 'Native schemas', version: '1' },
      paths: {},
      components: { schemas: { Value: { nullable: true, oneOf: [{ type: 'string' }, { type: 'integer' }] } } },
    }
    const before = structuredClone(document)

    expect(upgradeFromThreeToThreeOne(document)).toStrictEqual(before)
  })

  it('preserves example data on a reusable parameter named headers', () => {
    const example = { type: 'string', nullable: true }
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Parameters', version: '1' },
      paths: {},
      components: {
        parameters: { headers: { name: 'filter', in: 'query', schema: { type: 'object' }, example } },
      },
    })

    expect(result.components?.parameters?.headers).toStrictEqual({
      name: 'filter',
      in: 'query',
      schema: { type: 'object' },
      examples: { default: { value: example } },
    })
  })

  it('upgrades a reusable request body named x-example', () => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Bodies', version: '1' },
      paths: {},
      components: {
        requestBodies: {
          'x-example': { content: { 'application/json': { schema: { type: 'string', nullable: true } } } },
        },
      },
    })

    expect(result.components?.requestBodies?.['x-example']).toStrictEqual({
      content: { 'application/json': { schema: { type: ['string', 'null'] } } },
    })
  })

  it('upgrades a reusable response named x-example and preserves its extensions', () => {
    const extension = { schema: { nullable: true, oneOf: [{ type: 'number' }] } }
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Responses', version: '1' },
      paths: {},
      components: {
        responses: {
          'x-example': {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'string', nullable: true } } },
            'x-metadata': extension,
          },
        },
      },
    })

    expect(result.components?.responses?.['x-example']).toStrictEqual({
      description: 'OK',
      content: { 'application/json': { schema: { type: ['string', 'null'] } } },
      'x-metadata': extension,
    })
  })

  it.each(['x-event', 'default', 'example', 'examples'])('upgrades schemas in a legacy webhook named %s', (name) => {
    const extension = { schema: { nullable: true, oneOf: [{ type: 'number' }] } }
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Webhooks', version: '1' },
      paths: {},
      'x-webhooks': {
        [name]: {
          post: {
            'x-metadata': extension,
            requestBody: { content: { 'application/json': { schema: { type: 'string', nullable: true } } } },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })

    expect(result.webhooks).toStrictEqual({
      [name]: {
        post: {
          'x-metadata': extension,
          requestBody: { content: { 'application/json': { schema: { type: ['string', 'null'] } } } },
          responses: { '200': { description: 'OK' } },
        },
      },
    })
  })

  it('preserves callback expression-map extensions while upgrading named callbacks', () => {
    const metadata = { schema: { nullable: true, oneOf: [{ type: 'string' }] } }
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Callback extensions', version: '1' },
      paths: {
        '/subscribe': {
          post: {
            responses: { '200': { description: 'OK' } },
            callbacks: {
              'x-event': {
                'x-metadata': metadata,
                '{$request.body#/url}': {
                  post: {
                    requestBody: { content: { 'application/json': { schema: { type: 'string', nullable: true } } } },
                    responses: { '200': { description: 'OK' } },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths?.['/subscribe']?.post?.callbacks).toStrictEqual({
      'x-event': {
        'x-metadata': metadata,
        '{$request.body#/url}': {
          post: {
            requestBody: { content: { 'application/json': { schema: { type: ['string', 'null'] } } } },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })
  })

  it.each(['default', 'example', 'examples'])('upgrades a reusable request body named %s', (name) => {
    const example = { nullable: true }
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Named bodies', version: '1' },
      paths: {},
      components: {
        requestBodies: {
          [name]: {
            content: { 'application/json': { schema: { nullable: true, oneOf: [{ type: 'string' }], example } } },
          },
        },
      },
    })

    expect(result.components?.requestBodies).toStrictEqual({
      [name]: {
        content: {
          'application/json': {
            schema: { anyOf: [{ oneOf: [{ type: 'string' }] }, { type: 'null' }], examples: [example] },
          },
        },
      },
    })
  })

  it.each(['default', 'example', 'examples'])('upgrades request schemas in a callback named %s', (name) => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Named callbacks', version: '1' },
      paths: {
        '/subscribe': {
          post: {
            responses: { '200': { description: 'OK' } },
            callbacks: {
              [name]: {
                '{$request.body#/url}': {
                  post: {
                    requestBody: {
                      content: { 'application/json': { schema: { nullable: true, oneOf: [{ type: 'string' }] } } },
                    },
                    responses: { '200': { description: 'OK' } },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths?.['/subscribe']?.post?.callbacks).toStrictEqual({
      [name]: {
        '{$request.body#/url}': {
          post: {
            requestBody: {
              content: {
                'application/json': { schema: { anyOf: [{ oneOf: [{ type: 'string' }] }, { type: 'null' }] } },
              },
            },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })
  })

  it('upgrades schemas inside a callback named x-example', () => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Callbacks', version: '1' },
      paths: {
        '/subscribe': {
          post: {
            responses: { '200': { description: 'OK' } },
            callbacks: {
              'x-example': {
                '{$request.body#/callbackUrl}': {
                  post: {
                    requestBody: { content: { 'application/json': { schema: { type: 'string', nullable: true } } } },
                    responses: { '200': { description: 'OK' } },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths?.['/subscribe']?.post?.callbacks).toStrictEqual({
      'x-example': {
        '{$request.body#/callbackUrl}': {
          post: {
            requestBody: { content: { 'application/json': { schema: { type: ['string', 'null'] } } } },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })
  })

  it.each(['x-example', 'default', 'properties', 'headers'])(
    'upgrades response headers named %s while preserving their data',
    (name) => {
      const example = { type: 'string', nullable: true }
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.4',
        info: { title: 'Headers', version: '1' },
        paths: {
          '/items': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  headers: {
                    [name]: { schema: { type: 'object', nullable: true }, example },
                  },
                },
              },
            },
          },
        },
        components: {
          headers: { [name]: { schema: { type: 'object', nullable: true }, example } },
        },
      })

      const header = {
        schema: { type: ['object', 'null'] },
        examples: { default: { value: example } },
      }
      expect(result.paths?.['/items']?.get?.responses?.['200']).toStrictEqual({
        description: 'OK',
        headers: { [name]: header },
      })
      expect(result.components?.headers?.[name]).toStrictEqual(header)
    },
  )

  it.each(['properties', 'patternProperties', '$defs', 'definitions'])(
    'upgrades schemas named %s while preserving their example and default data',
    (name) => {
      const entry = { type: 'string', nullable: true }
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.4',
        info: { title: 'Examples', version: '1' },
        paths: {},
        components: {
          schemas: {
            [name]: {
              type: 'object',
              example: entry,
              default: entry,
              properties: { [name]: { type: 'object', example: entry, default: entry } },
            },
          },
        },
      })

      expect(result.components?.schemas?.[name]).toStrictEqual({
        type: 'object',
        examples: [entry],
        default: entry,
        properties: { [name]: { type: 'object', examples: [entry], default: entry } },
      })
    },
  )

  it.each([
    ['base64', { contentEncoding: 'base64' }],
    ['byte', { contentEncoding: 'base64' }],
  ])('migrates nullable %s strings without losing null', (format, expected) => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Nullable formats', version: '1.0.0' },
      paths: {},
      components: { schemas: { File: { type: 'string', format, nullable: true, description: 'A file' } } },
    })

    expect(result.components?.schemas?.File).toStrictEqual({
      type: ['string', 'null'],
      description: 'A file',
      ...expected,
    })
  })

  it.each([
    ['a', 'b'],
    ['a', 'b', null],
  ])('preserves nullable enum values %j', (...values) => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Nullable enum', version: '1.0.0' },
      paths: {},
      components: { schemas: { Choice: { type: 'string', enum: values, nullable: true } } },
    })

    expect(result.components?.schemas?.Choice).toStrictEqual({ type: ['string', 'null'], enum: values })
  })

  it.each(['minimum', 'maximum'] as const)('omits an exclusive %s without a bound', (bound) => {
    const keyword = bound === 'minimum' ? 'exclusiveMinimum' : 'exclusiveMaximum'
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Bounds', version: '1.0.0' },
      paths: {},
      components: { schemas: { Number: { type: 'number', [keyword]: true } } },
    })

    expect(result.components?.schemas?.Number).toStrictEqual({ type: 'number' })
  })

  it.each([true, false])('preserves zero bounds with exclusivity %s', (exclusive) => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Bounds', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Number: {
            type: 'number',
            minimum: 0,
            maximum: 0,
            exclusiveMinimum: exclusive,
            exclusiveMaximum: exclusive,
          },
        },
      },
    })

    expect(result.components?.schemas?.Number).toStrictEqual(
      exclusive
        ? { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 0 }
        : { type: 'number', minimum: 0, maximum: 0 },
    )
  })

  it.each([false, true])('migrates reusable raw binary with nullable %s', (nullable) => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Binary', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          File: {
            type: 'string',
            format: 'binary',
            ...(nullable ? { nullable: true } : {}),
            description: 'A file',
            maxLength: 100,
          },
        },
      },
    })

    expect(result.components?.schemas?.File).toStrictEqual({
      contentMediaType: 'application/octet-stream',
      description: 'A file',
      maxLength: 100,
    })
  })

  it.each(['application/octet-stream', 'image/png'])(
    'preserves %s media metadata and binary constraints',
    (mediaType) => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.4',
        info: { title: 'Binary', version: '1.0.0' },
        paths: {
          '/upload': {
            post: {
              requestBody: {
                content: {
                  [mediaType]: {
                    schema: { type: 'string', format: 'binary', nullable: true, description: 'A file', maxLength: 100 },
                    examples: { sample: { externalValue: 'https://example.com/file' } },
                  },
                },
              },
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      })

      expect(result.paths?.['/upload']?.post?.requestBody?.content[mediaType]).toStrictEqual({
        schema: { description: 'A file', maxLength: 100 },
        examples: { sample: { externalValue: 'https://example.com/file' } },
      })
    },
  )

  it.each([false, true])('migrates multipart binary fields and array items with nullable %s', (nullable) => {
    const file = { type: 'string', format: 'binary', ...(nullable ? { nullable: true } : {}) }
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Multipart', version: '1.0.0' },
      paths: {
        '/upload': {
          post: {
            requestBody: {
              content: {
                'multipart/form-data': {
                  schema: { type: 'object', properties: { file, files: { type: 'array', items: file } } },
                  encoding: { file: { contentType: 'image/png' }, files: { contentType: 'image/jpeg' } },
                },
              },
            },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })

    expect(result.paths?.['/upload']?.post?.requestBody?.content['multipart/form-data']).toStrictEqual({
      schema: {
        type: 'object',
        properties: {
          file: { contentMediaType: 'application/octet-stream' },
          files: { type: 'array', items: { contentMediaType: 'application/octet-stream' } },
        },
      },
      encoding: { file: { contentType: 'image/png' }, files: { contentType: 'image/jpeg' } },
    })
  })

  it('preserves non-binary schemas under application/octet-stream', () => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Binary', version: '1.0.0' },
      paths: {
        '/upload': {
          post: {
            requestBody: {
              content: {
                'application/octet-stream': {
                  schema: { $ref: '#/components/schemas/File' },
                },
              },
            },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
      components: { schemas: { File: { type: 'string', format: 'binary' } } },
    })

    expect(result.paths?.['/upload']?.post?.requestBody?.content['application/octet-stream']).toStrictEqual({
      schema: { $ref: '#/components/schemas/File' },
    })
  })

  it.each(['byte', 'base64'])('omits unknown media types for reusable %s schemas', (format) => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.4',
      info: { title: 'Encoded data', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          File: { type: 'string', format },
          Image: { type: 'string', format, contentMediaType: 'image/png' },
        },
      },
    })

    expect(result.components?.schemas).toStrictEqual({
      File: { type: 'string', contentEncoding: 'base64' },
      Image: { type: 'string', contentEncoding: 'base64', contentMediaType: 'image/png' },
    })
  })

  it.each(['application/json', 'multipart/form-data'])(
    'does not infer encoded data media types from %s',
    (mediaType) => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.4',
        info: { title: 'Encoded data', version: '1.0.0' },
        paths: {
          '/upload': {
            post: {
              requestBody: {
                content: {
                  [mediaType]: {
                    schema: {
                      type: 'object',
                      properties: {
                        file: { type: 'string', format: 'byte', nullable: true },
                        image: { type: 'string', format: 'byte', contentMediaType: 'image/png' },
                      },
                    },
                  },
                },
              },
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      })

      expect(result.paths?.['/upload']?.post?.requestBody?.content[mediaType].schema.properties).toStrictEqual({
        file: { type: ['string', 'null'], contentEncoding: 'base64' },
        image: { type: 'string', contentEncoding: 'base64', contentMediaType: 'image/png' },
      })
    },
  )

  describe('version', () => {
    it(`doesn't modify Swagger 2.0 files`, () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        swagger: '2.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.swagger).toBe('2.0')
    })

    it('changes the version to from 3.0.0 to 3.1.1', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.openapi).toBe('3.1.1')
    })

    it('changes the version to 3.0.3 to 3.1.1', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.3',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.openapi).toBe('3.1.1')
    })
  })

  describe('nullable types', () => {
    it('migrates nullable types', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'foobar',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'string',
                        nullable: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/test']?.get?.responses?.['200']?.content['application/json'].schema).toEqual({
        type: ['string', 'null'],
      })
    })

    it('removes an untyped nullable without a composition', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'foobar',
                  content: {
                    'application/json': {
                      schema: {
                        nullable: true,
                        properties: {
                          name: {
                            type: 'string',
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

      expect(result.paths?.['/test']?.get?.responses?.['200']?.content['application/json'].schema).toEqual({
        properties: {
          name: {
            type: 'string',
          },
        },
      })
    })

    it('migrates a nullable `allOf` wrapping a `$ref`', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.3',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Pet: { type: 'object', properties: { id: { type: 'integer' } } },
            Wrapper: {
              type: 'object',
              properties: {
                pet: {
                  nullable: true,
                  allOf: [{ $ref: '#/components/schemas/Pet' }],
                },
              },
            },
          },
        },
      })

      expect(result.components?.schemas?.Wrapper?.properties?.pet).toEqual({
        anyOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'null' }],
      })
    })

    it('migrates a nullable `$ref` sibling', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.3',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Pet: { type: 'object', properties: { id: { type: 'integer' } } },
            Wrapper: {
              type: 'object',
              properties: {
                pet: {
                  $ref: '#/components/schemas/Pet',
                  nullable: true,
                },
              },
            },
          },
        },
      })

      expect(result.components?.schemas?.Wrapper?.properties?.pet).toEqual({
        anyOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'null' }],
      })
    })

    /** Upgrades a document whose `Wrapper.value` property is `value`, beside a `Pet` component. */
    const upgradeValue = (value: Record<string, unknown>) => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.3',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Pet: { type: 'object', properties: { id: { type: 'integer' } } },
            Wrapper: { type: 'object', properties: { value } },
          },
        },
      })

      return result.components?.schemas?.Wrapper?.properties?.value
    }

    it('migrates a `oneOf` arm that is only `nullable: true` to a null arm', () => {
      expect(upgradeValue({ oneOf: [{ nullable: true }, { $ref: '#/components/schemas/Pet' }] })).toEqual({
        oneOf: [{ type: 'null' }, { $ref: '#/components/schemas/Pet' }],
      })
    })

    it('migrates a nullable-only `anyOf` arm and keeps its annotations', () => {
      expect(
        upgradeValue({
          anyOf: [
            { $ref: '#/components/schemas/Pet' },
            { nullable: true, description: 'No pet', 'x-note': 1 },
            { type: 'string' },
          ],
        }),
      ).toEqual({
        anyOf: [
          { $ref: '#/components/schemas/Pet' },
          { type: 'null', description: 'No pet', 'x-note': 1 },
          { type: 'string' },
        ],
      })
    })

    it.each(['oneOf', 'anyOf'])('keeps a default annotation when migrating a nullable-only %s arm', (keyword) => {
      expect(upgradeValue({ [keyword]: [{ nullable: true, default: null }, { type: 'string' }] })).toStrictEqual({
        [keyword]: [{ type: 'null', default: null }, { type: 'string' }],
      })
    })

    it.each(['oneOf', 'anyOf'])('preserves extension payloads when migrating a nullable-only %s arm', (keyword) => {
      expect(
        upgradeValue({
          [keyword]: [{ nullable: true, 'x-meta': { [keyword]: [{ nullable: true }] } }, { type: 'string' }],
        }),
      ).toStrictEqual({
        [keyword]: [{ type: 'null', 'x-meta': { [keyword]: [{ nullable: true }] } }, { type: 'string' }],
      })
    })

    it('migrates nullable-only arms inside schema properties with extension-like names', () => {
      expect(
        upgradeValue({ properties: { 'x-value': { oneOf: [{ nullable: true }, { type: 'string' }] } } }),
      ).toStrictEqual({
        properties: { 'x-value': { oneOf: [{ type: 'null' }, { type: 'string' }] } },
      })
    })

    it('migrates a nullable-only arm inside an `allOf` member', () => {
      expect(
        upgradeValue({ allOf: [{ oneOf: [{ nullable: true }, { $ref: '#/components/schemas/Pet' }] }, {}] }),
      ).toEqual({
        allOf: [{ oneOf: [{ type: 'null' }, { $ref: '#/components/schemas/Pet' }] }, {}],
      })
    })

    it('preserves constraints on an untyped nullable arm', () => {
      expect(
        upgradeValue({ oneOf: [{ nullable: true, required: ['id'] }, { $ref: '#/components/schemas/Pet' }] }),
      ).toEqual({
        oneOf: [{ required: ['id'] }, { $ref: '#/components/schemas/Pet' }],
      })
    })

    it('removes an ineffective nullable outside a union', () => {
      expect(upgradeValue({ nullable: true })).toStrictEqual({})
      expect(upgradeValue({ allOf: [{ nullable: true }, { $ref: '#/components/schemas/Pet' }] })).toEqual({
        allOf: [{}, { $ref: '#/components/schemas/Pet' }],
      })
    })

    it('keeps other keywords when unwrapping a nullable `$ref`', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.3',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Pet: { type: 'object', properties: { id: { type: 'integer' } } },
            Wrapper: {
              type: 'object',
              properties: {
                pet: {
                  description: 'The pet, or null',
                  nullable: true,
                  allOf: [{ $ref: '#/components/schemas/Pet' }],
                },
              },
            },
          },
        },
      })

      expect(result.components?.schemas?.Wrapper?.properties?.pet).toEqual({
        description: 'The pet, or null',
        anyOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'null' }],
      })
    })

    it('wraps a nullable multi-member `allOf` without dropping members', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.3',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Pet: { type: 'object', properties: { id: { type: 'integer' } } },
            Extra: { type: 'object', properties: { tag: { type: 'string' } } },
            Wrapper: {
              type: 'object',
              properties: {
                pet: {
                  nullable: true,
                  allOf: [{ $ref: '#/components/schemas/Pet' }, { $ref: '#/components/schemas/Extra' }],
                },
              },
            },
          },
        },
      })

      expect(result.components?.schemas?.Wrapper?.properties?.pet).toEqual({
        anyOf: [
          { allOf: [{ $ref: '#/components/schemas/Pet' }, { $ref: '#/components/schemas/Extra' }] },
          { type: 'null' },
        ],
      })
    })
  })

  describe('exclusiveMinimum and exclusiveMaximum', () => {
    it('migrate exclusiveMinimum and exclusiveMaximum', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'foobar',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'integer',
                        minimum: 1,
                        exclusiveMinimum: true,
                        maximum: 100,
                        exclusiveMaximum: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/test']?.get?.responses?.['200']?.content['application/json'].schema).toEqual({
        type: 'integer',
        exclusiveMinimum: 1,
        exclusiveMaximum: 100,
      })
    })
  })

  describe('migrates example to examples', () => {
    it('uses arrays in schemas', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'foobar',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'integer',
                        example: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/test']?.get?.responses?.['200']?.content['application/json'].schema).toEqual({
        type: 'integer',
        examples: [1],
      })
    })

    it('uses example objects everywhere else', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  schema: {
                    type: 'integer',
                    example: 10,
                  },
                  example: 10,
                },
              ],
            },
          },
        },
      })

      expect(result.paths?.['/test']?.get?.parameters?.[0]).toEqual({
        name: 'limit',
        in: 'query',
        schema: {
          type: 'integer',
          // array, because it's in a schema
          examples: [10],
        },
        // object, because it's not in a schema
        examples: {
          default: {
            value: 10,
          },
        },
      })
    })

    it(`doesn't transform arrays into objects`, () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Sample API',
          version: '1.0.0',
          description: 'A simple example API',
        },
        tags: [
          {
            'name': 'users',
            'description': 'Operations about users',
            'x-internal': true,
          },
        ],
        paths: {
          '/users': {
            post: {
              tags: ['users'],
              summary: 'hello',
              description: 'Returns a list of users',
              operationId: 'getUsers',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        foobar: {
                          type: 'array',
                          example: ['Portfolio1', 'Portfolio2'],
                          items: {
                            type: 'string',
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

      expect(
        result.paths?.['/users']?.post?.requestBody?.content['application/json'].schema.properties.foobar,
      ).toStrictEqual({
        type: 'array',
        examples: [['Portfolio1', 'Portfolio2']],
        items: {
          type: 'string',
        },
      })
    })

    it('preserves existing examples map without double nesting', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            post: {
              responses: {
                '201': {
                  description: 'Created machine account subtype.',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        required: ['technicalName', 'displayName', 'description'],
                        properties: {
                          id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Unique identifier for the subtype.',
                          },
                          technicalName: {
                            type: 'string',
                            description: 'Technical name of the subtype.',
                          },
                        },
                      },
                      examples: {
                        example: {
                          value: {
                            id: '43bdd144-4b17-4fce-a744-17c7fd3e717b',
                            technicalName: 'foo',
                            displayName: 'Mr Foo',
                            description: 'fighters',
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

      // The examples map should be preserved as-is, not double-nested
      const content = result.paths?.['/test']?.post?.responses?.['201']?.content['application/json']
      expect(content.examples).toEqual({
        example: {
          value: {
            id: '43bdd144-4b17-4fce-a744-17c7fd3e717b',
            technicalName: 'foo',
            displayName: 'Mr Foo',
            description: 'fighters',
          },
        },
      })

      // Should NOT have double nesting like examples.examples or value.value
      expect(content.examples).not.toHaveProperty('examples')
    })

    it('converts example to examples outside of examples map while preserving examples map', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              parameters: [
                {
                  name: 'id',
                  in: 'query',
                  example: 'test-123',
                },
              ],
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                      },
                      examples: {
                        success: {
                          value: {
                            status: 'ok',
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

      // Parameter example should be converted to examples
      expect(result.paths?.['/test']?.get?.parameters?.[0]).toEqual({
        name: 'id',
        in: 'query',
        examples: {
          default: {
            value: 'test-123',
          },
        },
      })

      // Response examples map should be preserved as-is
      const content = result.paths?.['/test']?.get?.responses?.['200']?.content['application/json']
      expect(content.examples).toEqual({
        success: {
          value: {
            status: 'ok',
          },
        },
      })
    })

    it('converts example to examples for schema properties named "examples"', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        components: {
          schemas: {
            MySchema: {
              type: 'object',
              properties: {
                examples: {
                  type: 'object',
                  description: 'A property named examples',
                  example: { foo: 'bar' },
                },
                name: {
                  type: 'string',
                  example: 'John',
                },
              },
            },
          },
        },
      })

      // The 'examples' property should have its 'example' converted to 'examples' array
      expect(result.components?.schemas?.MySchema?.properties?.examples).toEqual({
        type: 'object',
        description: 'A property named examples',
        examples: [{ foo: 'bar' }],
      })

      // The 'name' property should also have its 'example' converted
      expect(result.components?.schemas?.MySchema?.properties?.name).toEqual({
        type: 'string',
        examples: ['John'],
      })
    })

    it('does not convert a schema property named "example"', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        components: {
          schemas: {
            MySchema: {
              type: 'object',
              properties: {
                documentation: { type: 'string', nullable: true },
                example: { type: 'string', nullable: true },
                platform: { type: 'string', nullable: true },
              },
            },
          },
        },
      })

      // The 'example' key is a property name, so it must stay a property, not become an examples array
      expect(result.components?.schemas?.MySchema?.properties).toEqual({
        documentation: { type: ['string', 'null'] },
        example: { type: ['string', 'null'] },
        platform: { type: ['string', 'null'] },
      })
    })

    it('does not convert a schema named "example" in components/schemas', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: { title: 'Hello World', version: '1.0.0' },
        components: {
          schemas: {
            example: { type: 'string', nullable: true },
            other: { type: 'number' },
          },
        },
      })

      // The 'example' key is a schema name, so it must stay a schema entry, not become an examples array
      expect(result.components?.schemas).toEqual({
        example: { type: ['string', 'null'] },
        other: { type: 'number' },
      })
    })

    it('does not convert a "$defs" entry named "example"', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: { title: 'Hello World', version: '1.0.0' },
        components: {
          schemas: {
            MySchema: {
              type: 'object',
              $defs: {
                example: { type: 'string' },
              },
            },
          },
        },
      })

      expect((result.components?.schemas?.MySchema as OpenAPIV3_1.SchemaObject)?.$defs).toEqual({
        example: { type: 'string' },
      })
    })

    it('still converts a real "example" keyword nested under a property named "example"', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: { title: 'Hello World', version: '1.0.0' },
        components: {
          schemas: {
            MySchema: {
              type: 'object',
              properties: {
                example: { type: 'string', example: 'foo' },
              },
            },
          },
        },
      })

      // The outer 'example' stays a property; its inner 'example' keyword still becomes 'examples'
      expect(result.components?.schemas?.MySchema?.properties).toEqual({
        example: { type: 'string', examples: ['foo'] },
      })
    })

    it('does not treat data inside an example value as a schema', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: { title: 'Hello World', version: '1.0.0' },
        components: {
          schemas: {
            MySchema: {
              type: 'string',
              example: { type: 'string', nullable: true, exclusiveMinimum: true, minimum: 5, 'x-webhooks': { a: 1 } },
            },
          },
        },
      })

      // The example is arbitrary data, so it is preserved verbatim inside the examples array
      expect((result.components?.schemas?.MySchema as OpenAPIV3_1.SchemaObject)?.examples).toEqual([
        { type: 'string', nullable: true, exclusiveMinimum: true, minimum: 5, 'x-webhooks': { a: 1 } },
      ])
    })

    it('does not treat data inside a default value as a schema', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: { title: 'Hello World', version: '1.0.0' },
        components: {
          schemas: {
            MySchema: {
              type: 'object',
              default: { nullable: true, type: 'anything' },
            },
          },
        },
      })

      expect((result.components?.schemas?.MySchema as OpenAPIV3_1.SchemaObject)?.default).toEqual({
        nullable: true,
        type: 'anything',
      })
    })

    it('does not treat the value of an Example Object as a schema', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/things': {
            get: {
              responses: {
                '200': {
                  description: 'ok',
                  content: {
                    'application/json': {
                      schema: { type: 'object' },
                      examples: {
                        sample: { value: { type: 'string', nullable: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      const mediaType = (result.paths?.['/things']?.get?.responses?.['200'] as OpenAPIV3_1.ResponseObject)?.content?.[
        'application/json'
      ]

      // The example value is data, so it is preserved verbatim
      expect((mediaType?.examples?.sample as OpenAPIV3_1.ExampleObject)?.value).toEqual({
        type: 'string',
        nullable: true,
      })
    })

    it('still upgrades a schema property named "value" inside a schema named "examples"', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: { title: 'Hello World', version: '1.0.0' },
        components: {
          schemas: {
            examples: {
              type: 'object',
              properties: {
                value: { type: 'string', nullable: true },
              },
            },
          },
        },
      })

      // This 'value' is a real schema, not Example Object data, so nullable is still upgraded
      expect(result.components?.schemas?.examples?.properties?.value).toEqual({ type: ['string', 'null'] })
    })
  })

  describe('upgrading x-webhooks', () => {
    it('renames x-webhooks to webhooks at the document root', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: { title: 'Hello World', version: '1.0.0' },
        'x-webhooks': { onEvent: { post: { responses: { '200': { description: 'ok' } } } } },
      })

      expect(result.webhooks).toEqual({ onEvent: { post: { responses: { '200': { description: 'ok' } } } } })
      expect((result as Record<string, unknown>)['x-webhooks']).toBeUndefined()
    })

    it('does not rename a schema property named x-webhooks', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: { title: 'Hello World', version: '1.0.0' },
        components: {
          schemas: {
            MySchema: {
              type: 'object',
              properties: {
                'x-webhooks': { type: 'string' },
              },
            },
          },
        },
      })

      expect(result.components?.schemas?.MySchema?.properties).toEqual({
        'x-webhooks': { type: 'string' },
      })
    })
  })

  describe('describing File Upload Payloads', () => {
    it('removes JSON type constraints for binary file uploads', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/upload': {
            post: {
              requestBody: {
                content: {
                  'application/octet-stream': {
                    schema: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/upload']?.post?.requestBody?.content['application/octet-stream']).toStrictEqual({
        schema: {},
      })
    })

    it('migrates base64 format to contentEncoding for image uploads', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/upload': {
            post: {
              requestBody: {
                content: {
                  'image/png': {
                    schema: {
                      type: 'string',
                      format: 'base64',
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result.paths?.['/upload']?.post?.requestBody?.content['image/png']).toEqual({
        schema: {
          type: 'string',
          contentEncoding: 'base64',
        },
      })
    })

    it('migrates binary format for multipart file uploads', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/upload': {
            post: {
              requestBody: {
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      properties: {
                        orderId: {
                          type: 'integer',
                        },
                        fileName: {
                          type: 'string',
                          description: 'The file name',
                          format: 'binary',
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

      expect(result.paths?.['/upload']?.post?.requestBody?.content['multipart/form-data']).toEqual({
        schema: {
          type: 'object',
          properties: {
            orderId: {
              type: 'integer',
            },
            fileName: {
              description: 'The file name',
              contentMediaType: 'application/octet-stream',
            },
          },
        },
      })
    })
  })

  it('migrates byte format', () => {
    const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/upload': {
          post: {
            requestBody: {
              content: {
                'image/png': {
                  schema: {
                    type: 'string',
                    format: 'byte',
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.paths?.['/upload']?.post?.requestBody?.content['image/png']).toEqual({
      schema: {
        type: 'string',
        contentEncoding: 'base64',
      },
    })
  })

  describe.skip('declaring $schema', () => {
    it('adds a $schema', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.$schema).toBe('http://json-schema.org/draft-07/schema#')
    })
  })

  describe('binary format handling with oneOf', () => {
    it('correctly handles format: binary in oneOf schemas', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/images/edits': {
            post: {
              requestBody: {
                required: true,
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      required: ['model', 'prompt'],
                      properties: {
                        model: {
                          type: 'string',
                          enum: ['Kolors'],
                        },
                        image: {
                          oneOf: [
                            {
                              type: 'string',
                              format: 'binary',
                            },
                            {
                              type: 'string',
                            },
                          ],
                        },
                        prompt: {
                          type: 'string',
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

      expect(
        result.paths?.['/images/edits']?.post?.requestBody?.content['multipart/form-data'].schema.properties.image
          .oneOf[0],
      ).toStrictEqual({
        contentMediaType: 'application/octet-stream',
      })
    })
  })

  describe('webhooks', () => {
    it('correctly upgrades x-webhooks to webhooks', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        'x-webhooks': {
          'test': {
            post: {
              requestBody: {
                required: true,
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'string',
                      example: 'test',
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(result['webhooks']).toEqual({
        'test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'string',
                    examples: ['test'],
                  },
                },
              },
            },
          },
        },
      })
    })
  })
  describe('default responses', () => {
    it('upgrades the schemas of a default response', () => {
      const result: OpenAPIV3_1.Document = upgradeFromThreeToThreeOne({
        openapi: '3.0.3',
        info: { title: 'Default responses', version: '1.0.0' },
        paths: {
          '/pets': {
            get: {
              responses: {
                default: {
                  description: 'Error',
                  content: { 'application/json': { schema: { type: 'string', nullable: true, example: 'oops' } } },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            // A property called `responses` keeps its `default` keyword as data.
            Model: { properties: { responses: { type: 'object', default: { nullable: true } } } },
          },
        },
      })

      expect(result.paths?.['/pets']?.get?.responses?.default).toStrictEqual({
        description: 'Error',
        content: { 'application/json': { schema: { type: ['string', 'null'], examples: ['oops'] } } },
      })
      expect(result.components?.schemas?.Model).toStrictEqual({
        properties: { responses: { type: 'object', default: { nullable: true } } },
      })
    })
  })
})
