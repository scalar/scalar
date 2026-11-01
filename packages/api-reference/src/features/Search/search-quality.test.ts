import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createNavigation, traverseAsyncApiDocument } from '@scalar/workspace-store/navigation'
import type {
  OpenApiDocument,
  ResponseObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { FuseResult } from 'fuse.js'
import { describe, expect, it } from 'vitest'

import { createFuseInstance } from './helpers/create-fuse-instance'
import { createSearchIndex } from './helpers/create-search-index'
import { useSearchIndex } from './hooks/useSearchIndex'
import type { FuseData } from './types'

function search(query: string, document: Partial<OpenApiDocument>, limit?: number): FuseResult<FuseData>[] {
  const doc = {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    ...document,
  } as OpenApiDocument
  doc['x-scalar-navigation'] = createNavigation('test', doc, { hideModels: false })

  const fuse = createFuseInstance()

  fuse.setCollection(createSearchIndex(doc))

  return fuse.search(query, { limit })
}

describe('search-quality', () => {
  const response = (schema: SchemaObject): ResponseObject => ({
    description: 'Result',
    content: { 'application/json': { schema } },
  })

  const fieldSchema: SchemaObject = {
    type: 'object',
    properties: { zirconiumReceipt: { type: 'string', description: 'Crystalline delivery confirmation' } },
  }

  const shapes: [string, SchemaObject][] = [
    ['response-only', fieldSchema],
    [
      'deep objects',
      {
        type: 'object',
        properties: {
          first: { type: 'object', properties: { second: { type: 'object', properties: { third: fieldSchema } } } },
        },
      },
    ],
    ['arrays', { type: 'array', items: fieldSchema }],
    ['nested arrays', { type: 'array', items: { type: 'array', items: fieldSchema } }],
    ...(['allOf', 'anyOf', 'oneOf'] as const).map((keyword): [string, SchemaObject] => [
      keyword,
      {
        type: 'object',
        [keyword]: [
          {
            type: 'object',
            properties: {
              values: { type: 'array', items: { $ref: '#/components/schemas/Receipt', '$ref-value': fieldSchema } },
            },
          },
        ],
      },
    ]),
    [
      'reference chain',
      { type: 'object', allOf: [{ $ref: '#/a', '$ref-value': { $ref: '#/b', '$ref-value': fieldSchema } }] },
    ],
  ]

  it.each(shapes)('finds %s fields in operations, models, and webhooks', (_name, schema) => {
    const requestBody = { content: { 'application/json': { schema } } }
    const document: Partial<OpenApiDocument> = {
      paths: {
        '/output': { get: { responses: { '200': response(schema) } } },
        '/input': { post: { requestBody } },
      },
      webhooks: {
        incoming: { post: { requestBody } },
        outgoing: { post: { responses: { '200': response(schema) } } },
      },
      components: { schemas: { Receipt: schema } },
    }
    for (const query of ['zirconiumReceipt', 'Crystalline delivery confirmation']) {
      const results = search(query, document)
      expect(results.map(({ item }) => item.type).sort()).toEqual([
        'model',
        'operation',
        'operation',
        'webhook',
        'webhook',
      ])
      expect(
        results
          .filter(({ item }) => item.type === 'operation')
          .map(({ item }) => item.path)
          .sort(),
      ).toEqual(['/input', '/output'])
      expect(results.every(({ item }) => item.id === item.entry.id)).toBe(true)
    }
  })

  it.each(['3.0.4', '3.1.2', '3.2.1'])('respects schema reference siblings in OpenAPI %s', (openapi) => {
    const target: SchemaObject = { type: 'object', properties: { inheritedField: { type: 'string' } } }
    const schema = {
      type: 'object',
      $ref: '#/components/schemas/Base',
      '$ref-value': target,
      allOf: [{ type: 'object', properties: { composedSibling: { type: 'string' } } }],
      properties: {
        localSibling: {
          $ref: '#/components/schemas/String',
          '$ref-value': { type: 'string' },
          description: 'Saffron dispatch annotation',
        },
      },
    } satisfies SchemaObject & { $ref: string; '$ref-value': SchemaObject }
    const document: Partial<OpenApiDocument> = {
      openapi,
      paths: { '/output': { get: { responses: { '200': response(schema) } } } },
      components: { schemas: { Receipt: schema } },
    }
    expect(
      search('inheritedField', document)
        .map(({ item }) => item.type)
        .sort(),
    ).toEqual(['model', 'operation'])
    for (const query of ['localSibling', 'composedSibling', 'Saffron dispatch annotation']) {
      expect(
        search(query, document)
          .map(({ item }) => item.type)
          .sort(),
      ).toEqual(openapi === '3.0.4' ? [] : ['model', 'operation'])
    }
  })

  it('indexes every response code and media type, including resolved responses', () => {
    const document: Partial<OpenApiDocument> = {
      paths: {
        '/output': {
          get: {
            responses: {
              '200': { $ref: '#/components/responses/Success', '$ref-value': response(fieldSchema) },
              '400': {
                description: 'Error',
                content: {
                  'application/json': { schema: { type: 'object', properties: { problemMarker: { type: 'string' } } } },
                  'application/xml': { schema: { type: 'object', properties: { xmlFailureCode: { type: 'string' } } } },
                },
              },
              default: response({ type: 'object', properties: { fallbackReason: { type: 'string' } } }),
              '503': { $ref: '#/missing' },
            },
          },
        },
      },
    }
    for (const query of ['zirconiumReceipt', 'problemMarker', 'xmlFailureCode', 'fallbackReason']) {
      expect(search(query, document).map(({ item }) => item.path)).toEqual(['/output'])
    }
  })

  it('terminates recursive and mutually recursive schemas without losing shared operation fields', () => {
    const first: SchemaObject = { type: 'object', properties: { ...fieldSchema.properties } }
    const second: SchemaObject = { type: 'object', properties: { mutualMarker: { type: 'string' }, parent: first } }
    first.properties = { ...first.properties, child: { $ref: '#/first', '$ref-value': first }, second }
    const document: Partial<OpenApiDocument> = {
      paths: {
        '/one': {
          get: {
            requestBody: { content: { 'application/json': { schema: first } } },
            responses: { '200': response(first) },
          },
        },
        '/two': { get: { responses: { '200': response(first) } } },
      },
    }
    for (const query of ['zirconiumReceipt', 'mutualMarker']) {
      expect(
        search(query, document)
          .map(({ item }) => item.path)
          .sort(),
      ).toEqual(['/one', '/two'])
    }
    expect(search('zirconiumReceipt', document)[0]?.item.body).toEqual([
      'zirconiumReceipt',
      'child',
      'second',
      'mutualMarker',
      'parent',
    ])
  })

  it('ranks exact response field names above incidental prose without indexing schema metadata', () => {
    const document: Partial<OpenApiDocument> = {
      paths: {
        '/prose': { get: { description: 'Use zirconiumReceipt when reading the delivery guide.' } },
        '/field': {
          get: {
            responses: {
              '200': response({
                ...fieldSchema,
                title: 'MetadataOnlySentinel',
                example: { ignoredExample: true },
                properties: { ...fieldSchema.properties, unresolvedField: { $ref: '#/missing' } },
              }),
            },
          },
        },
      },
    }
    expect(search('zirconiumReceipt', document).map(({ item }) => item.path)).toEqual(['/field', '/prose'])
    expect(search('unresolvedField', document).map(({ item }) => item.path)).toEqual(['/field'])
    expect(search('MetadataOnlySentinel', document)).toEqual([])
    expect(search('ignoredExample', document)).toEqual([])
  })

  it('keeps exact fields ahead of many incidental description matches', () => {
    const proseSchema: SchemaObject = {
      type: 'object',
      properties: Object.fromEntries(
        Array.from({ length: 100 }, (_, index) => [
          `field${index}`,
          { type: 'string', description: `Read zirconiumReceipt in guide number ${index}` },
        ]),
      ),
    }
    const document: Partial<OpenApiDocument> = {
      paths: {
        '/prose': { get: { responses: { '200': response(proseSchema) } } },
        '/field': { get: { responses: { '200': response(fieldSchema) } } },
      },
    }
    expect(search('zirconiumReceipt', document).map(({ item }) => item.path)).toEqual(['/field', '/prose'])
    expect(search('zirconiumReceipt', document, 1).map(({ item }) => item.path)).toEqual(['/field'])
  })

  it('finds nested AsyncAPI model fields through multi-format wrappers', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Events', version: '1' },
      'x-scalar-original-document-hash': '',
      components: {
        schemas: {
          Receipt: {
            schemaFormat: 'application/schema+json;version=draft-07',
            schema: {
              type: 'array',
              items: { type: 'object', allOf: [fieldSchema] },
            },
          },
        },
      },
    } as unknown as AsyncApiDocument
    document['x-scalar-navigation'] = traverseAsyncApiDocument('test', document)
    const fuse = createFuseInstance()
    fuse.setCollection(createSearchIndex(document))
    expect(fuse.search('zirconiumReceipt').map(({ item }) => item.title)).toEqual(['Receipt'])
    expect(fuse.search('Crystalline delivery confirmation').map(({ item }) => item.title)).toEqual(['Receipt'])
  })

  it('bounds deeply nested schemas and still visits a shared schema through a shorter path', () => {
    const deep: SchemaObject = Array.from({ length: 200 }).reduce<SchemaObject>(
      (items) => ({ type: 'array', items }),
      fieldSchema,
    )
    expect(
      search('zirconiumReceipt', { paths: { '/deep': { get: { responses: { '200': response(deep) } } } } }),
    ).toEqual([])
    const shared: SchemaObject = { type: 'object', properties: { leaf: fieldSchema } }
    const nearLimit = Array.from({ length: 63 }).reduce<SchemaObject>((items) => ({ type: 'array', items }), shared)
    const schema: SchemaObject = { type: 'object', allOf: [nearLimit, shared] }
    expect(
      search('zirconiumReceipt', { paths: { '/shared': { get: { responses: { '200': response(schema) } } } } }).map(
        ({ item }) => item.path,
      ),
    ).toEqual(['/shared'])
  })

  it('bounds wide schemas and indexed prose', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: Object.fromEntries(
        Array.from({ length: 12_000 }, (_, index) => [`field${index}`, { type: 'string' }]),
      ),
    }
    const document: Partial<OpenApiDocument> = {
      paths: { '/wide': { get: { responses: { '200': response(schema) } } } },
    }
    const body = search('field0', document)[0]?.item.body
    expect(Array.isArray(body)).toBe(true)
    expect(body?.length).toBe(9_999)
    expect(body?.includes('field11999')).toBe(false)

    const verbose: SchemaObject = {
      type: 'object',
      properties: Object.fromEntries(
        Array.from({ length: 100 }, (_, index) => [
          `entry${index}`,
          { type: 'string', description: `${index}${'x'.repeat(5_000)}` },
        ]),
      ),
    }
    const item = search('entry0', { paths: { '/verbose': { get: { responses: { '200': response(verbose) } } } } })[0]
      ?.item
    const strings = [...(Array.isArray(item?.body) ? item.body : []), ...(item?.bodyDescriptions ?? [])]
    expect(strings.reduce((sum, value) => sum + value.length, 0)).toBe(100_000)
    expect(strings.every((value) => value.length <= 2_048)).toBe(true)
  })

  it('preserves the search result limit and owning operation navigation entries', () => {
    const document = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1' },
      'x-scalar-original-document-hash': '',
      paths: Object.fromEntries(
        Array.from({ length: 30 }, (_, index) => [
          `/resource/${index}`,
          { get: { responses: { '200': response(fieldSchema) } } },
        ]),
      ),
    } as OpenApiDocument
    document['x-scalar-navigation'] = createNavigation('test', document, { hideModels: false })
    const { query, results } = useSearchIndex(document)
    expect(results.value.length).toBe(25)
    query.value = 'zirconiumReceipt'
    expect(results.value.length).toBe(25)
    expect(
      results.value.every(
        ({ item }) => item.entry.type === 'operation' && item.entry.path === item.path && item.entry.id === item.id,
      ),
    ).toBe(true)
  })

  it('looks up operations by summary', () => {
    const query = 'Get a token'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            tags: ['Authentication'],
            summary: 'Get a token',
            description: 'Yeah, this is the boring security stuff. Just get your super secret token and move on.',
            operationId: 'getToken',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.title).toEqual('Get a token')
    expect(result.length).toEqual(1)
  })

  it('finds operations by partial title match', () => {
    const query = 'token'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            tags: ['Authentication'],
            summary: 'Get a token',
            description: 'Authentication endpoint',
            operationId: 'getToken',
          },
        },
        '/auth/refresh': {
          post: {
            tags: ['Authentication'],
            summary: 'Refresh token',
            description: 'Refresh authentication token',
            operationId: 'refreshToken',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result).toHaveLength(2)
    expect(result[0]?.item?.title).toContain('token')
    expect(result[1]?.item?.title).toContain('token')
  })

  it('finds operations by operationId', () => {
    const query = 'getToken'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            tags: ['Authentication'],
            summary: 'Get a token',
            description: 'Authentication endpoint',
            operationId: 'getToken',
          },
        },
      },
    }
    const result = search(query, document)
    expect(result[0]?.item?.operationId).toEqual('getToken')
    expect(result[0]?.item?.title).toEqual('Get a token')
  })

  it('finds operations by HTTP method', () => {
    const query = 'POST'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            tags: ['Authentication'],
            summary: 'Get a token',
            description: 'Authentication endpoint',
            operationId: 'getToken',
          },
        },
        '/users': {
          post: {
            tags: ['Users'],
            summary: 'Create user',
            description: 'Create a new user',
            operationId: 'createUser',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result).toHaveLength(2)
    expect(result[0]?.item?.method).toEqual('post')
    expect(result[1]?.item?.method).toEqual('post')
  })

  it('finds operations by path', () => {
    const query = '/auth'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            summary: 'Get a token',
            description: 'Authentication endpoint',
            operationId: 'getToken',
          },
        },
        '/auth/logout': {
          post: {
            summary: 'Logout user',
            description: 'Logout endpoint',
            operationId: 'logoutUser',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result).toHaveLength(2)
    expect(result[0]?.item?.path).toContain('/auth')
    expect(result[1]?.item?.path).toContain('/auth')
  })

  it.todo('finds operations by tag', () => {
    const query = 'Foobar'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            tags: ['Foobar'],
            summary: 'Get a token',
            description: 'Authentication endpoint',
            operationId: 'getToken',
          },
        },
        '/auth/logout': {
          post: {
            tags: ['Foobar'],
            summary: 'Logout user',
            description: 'Logout endpoint',
            operationId: 'logoutUser',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('operation')
    expect(result[1]?.item?.type).toEqual('operation')
    expect(result).toHaveLength(3)
  })

  it('finds operations by description content', () => {
    const query = 'boring security'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            tags: ['Authentication'],
            summary: 'Get a token',
            description: 'Yeah, this is the boring security stuff. Just get your super secret token and move on.',
            operationId: 'getToken',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.title).toEqual('Get a token')
    expect(result[0]?.item?.description).toContain('boring security')
  })

  it('finds models by title', () => {
    const query = 'User'

    const document: Partial<OpenApiDocument> = {
      components: {
        schemas: {
          User: {
            type: 'object',
            title: 'User',
            description: 'A user in the system',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('model')
    expect(result[0]?.item?.title).toEqual('User')
  })

  it('finds models by description', () => {
    const query = 'user in the system'

    const document: Partial<OpenApiDocument> = {
      components: {
        schemas: {
          User: {
            type: 'object',
            title: 'User',
            description: 'A user in the system',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('model')
    expect(result[0]?.item?.title).toEqual('User')
  })

  it('finds webhooks by title', () => {
    const query = 'user.created'

    const document: Partial<OpenApiDocument> = {
      webhooks: {
        'user.created': {
          post: {
            summary: 'User created webhook',
            description: 'Fired when a user is created',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('webhook')
    expect(result[0]?.item?.title).toEqual('User created webhook')
  })

  it('finds webhooks by description', () => {
    const query = 'fired when'

    const document: Partial<OpenApiDocument> = {
      webhooks: {
        'user.created': {
          post: {
            summary: 'User created webhook',
            description: 'Fired when a user is created',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('webhook')
    expect(result[0]?.item?.title).toEqual('User created webhook')
  })

  it('finds tags by name', () => {
    const query = 'Users'

    const document: Partial<OpenApiDocument> = {
      tags: [
        {
          name: 'Users',
          description: 'User management operations',
        },
      ],
      paths: {
        '/users': {
          get: {
            tags: ['Users'],
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('tag')
    expect(result[0]?.item?.title).toEqual('Users')
  })

  it('finds tags by description', () => {
    const query = 'user management'

    const document: Partial<OpenApiDocument> = {
      tags: [
        {
          name: 'Users',
          description: 'User management operations',
        },
      ],
      paths: {
        '/users': {
          get: {
            tags: ['Users'],
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('tag')
    expect(result[0]?.item?.title).toEqual('Users')
  })

  it('finds headings by title', () => {
    const query = 'Models'

    const document: Partial<OpenApiDocument> = {
      info: {
        title: 'API Reference',
        description: 'This is a test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          User: {
            type: 'string',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('heading')
    expect(result[0]?.item?.title).toEqual('Models')
  })

  it('handles case-insensitive search', () => {
    const query = 'user'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            description: 'Retrieve all users',
            operationId: 'getUsers',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result).toHaveLength(1)
    expect(result[0]?.item?.title).toEqual('Get users')
  })

  it('handles fuzzy matching with typos', () => {
    const query = 'get a tken' // typo for "token"

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            summary: 'Get a token',
            description: 'Authentication endpoint',
            operationId: 'getToken',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result).toHaveLength(1)
    expect(result[0]?.item?.title).toEqual('Get a token')
  })

  it('prioritizes title matches over description matches', () => {
    const query = 'token'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            tags: ['Authentication'],
            summary: 'Get a token',
            description: 'Authentication endpoint for getting tokens',
            operationId: 'getToken',
          },
        },
        '/users': {
          get: {
            tags: ['Users'],
            summary: 'Get users',
            description: 'This endpoint returns user tokens',
            operationId: 'getUsers',
          },
        },
      },
    }

    const result = search(query, document)

    // The operation with "token" in the title should score higher
    expect(result[0]?.item?.title).toEqual('Get a token')
    expect(result[0]?.score).toBeLessThan(result[1]?.score || 1)
  })

  it('returns empty results for non-matching queries', () => {
    const query = 'nonexistent'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/token': {
          post: {
            tags: ['Authentication'],
            summary: 'Get a token',
            description: 'Authentication endpoint',
            operationId: 'getToken',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result).toHaveLength(0)
  })

  it('handles empty document gracefully', () => {
    const query = 'test'

    const document: Partial<OpenApiDocument> = {}

    const result = search(query, document)

    expect(result).toHaveLength(0)
  })

  it.todo('handles complex nested schemas', () => {
    const query = 'address'

    const document: Partial<OpenApiDocument> = {
      components: {
        schemas: {
          User: {
            type: 'object',
            title: 'User',
            properties: {
              address: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                },
              },
            },
          },
        },
      },
    }

    const result = search(query, document)

    expect(result).toHaveLength(1)
    expect(result[0]?.item?.type).toEqual('model')
  })

  it('finds operations with request body parameters', () => {
    const query = 'email'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/auth/register': {
          post: {
            tags: ['Authentication'],
            summary: 'Register user',
            description: 'Create a new user account',
            operationId: 'registerUser',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      email: { type: 'string' },
                      password: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = search(query, document)

    expect(result.sort((a, b) => <number>b.score - <number>a.score)[0]?.item?.title).toEqual('Register user')
  })

  it('finds operations by response example content', () => {
    const query = 'already exists'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/users': {
          post: {
            summary: 'Create user',
            operationId: 'createUser',
            responses: {
              409: {
                description: 'Conflict',
                content: {
                  'application/json': {
                    examples: {
                      duplicateEmail: {
                        value: {
                          code: 'duplicate_email',
                          message: 'User with this email already exists',
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
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('operation')
    expect(result[0]?.item?.title).toEqual('Create user')
  })

  it('finds operations by query parameter name', () => {
    const query = 'limit'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            operationId: 'listUsers',
            parameters: [
              {
                in: 'query',
                name: 'limit',
                description: 'Maximum number of results',
                schema: { type: 'integer' },
              },
            ],
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('operation')
    expect(result[0]?.item?.title).toEqual('List users')
  })

  it('finds operations by parameter description', () => {
    const query = 'maximum number'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            operationId: 'listUsers',
            parameters: [
              {
                in: 'query',
                name: 'limit',
                description: 'Maximum number of results to return',
                schema: { type: 'integer' },
              },
            ],
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('operation')
    expect(result[0]?.item?.title).toEqual('List users')
  })

  it('finds operations by path parameter', () => {
    const query = 'userId'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/users/{userId}': {
          get: {
            summary: 'Get user by ID',
            operationId: 'getUserById',
            parameters: [
              {
                in: 'path',
                name: 'userId',
                required: true,
                description: 'Unique user identifier',
                schema: { type: 'string' },
              },
            ],
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('operation')
    expect(result[0]?.item?.title).toEqual('Get user by ID')
  })

  it('finds operations by both parameter and request body', () => {
    const query = 'username'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/users/{userId}': {
          put: {
            summary: 'Update user',
            operationId: 'updateUser',
            parameters: [
              {
                in: 'path',
                name: 'userId',
                required: true,
                schema: { type: 'string' },
              },
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      username: { type: 'string', description: 'New username for the user' },
                      email: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        '/posts': {
          get: {
            summary: 'List posts',
            operationId: 'listPosts',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('operation')
    expect(result[0]?.item?.title).toEqual('Update user')
  })

  it('finds operations with request body from non-json content types', () => {
    const query = 'xmlField'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/data/import': {
          post: {
            summary: 'Import data',
            operationId: 'importData',
            requestBody: {
              content: {
                'application/xml': {
                  schema: {
                    type: 'object',
                    properties: {
                      xmlField: { type: 'string', description: 'XML data field' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('operation')
    expect(result[0]?.item?.title).toEqual('Import data')
  })

  it('finds operations with multiple content types in request body', () => {
    const query = 'formField'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/upload': {
          post: {
            summary: 'Upload file',
            operationId: 'uploadFile',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      jsonField: { type: 'string' },
                    },
                  },
                },
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      formField: { type: 'string', description: 'Form field for upload' },
                      file: { type: 'string', format: 'binary' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.type).toEqual('operation')
    expect(result[0]?.item?.title).toEqual('Upload file')
  })

  it('ranks an operation that defines a parameter above one that mentions it in prose', () => {
    const query = 'limit'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            operationId: 'listUsers',
            parameters: [
              {
                in: 'query',
                name: 'limit',
                description: 'Maximum number of results',
                schema: { type: 'integer' },
              },
            ],
          },
        },
        '/rate-info': {
          get: {
            summary: 'Rate info',
            description: 'Returns the current API rate limit window for the caller.',
            operationId: 'getRateInfo',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.title).toEqual('List users')
  })

  it('ranks an operation that defines a body field above one that mentions it in prose', () => {
    const query = 'email'

    const document: Partial<OpenApiDocument> = {
      paths: {
        '/users': {
          post: {
            summary: 'Create user',
            operationId: 'createUser',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                      email: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        '/notifications': {
          get: {
            summary: 'List notifications',
            description: 'Returns notifications including any pending email delivery confirmations.',
            operationId: 'listNotifications',
          },
        },
      },
    }

    const result = search(query, document)

    expect(result[0]?.item?.title).toEqual('Create user')
  })

  it('does not match parameter filter metadata like "query" or "REQUIRED"', () => {
    // These filter-style tokens used to be packed into the indexed parameter string and
    // produced false-positive matches. They should no longer be searchable.
    const document: Partial<OpenApiDocument> = {
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            operationId: 'listUsers',
            parameters: [
              {
                in: 'query',
                name: 'limit',
                required: true,
                schema: { type: 'integer' },
              },
            ],
          },
        },
      },
    }

    expect(search('REQUIRED', document)).toHaveLength(0)
    expect(search('integer', document)).toHaveLength(0)
  })

  it('finds a model entry by one of its property names', () => {
    // Mirrors the Galaxy spec's `Satellite` model — a standalone component schema with a
    // top-level `diameter` property. Searching `diameter` should surface the model.
    const document = {
      components: {
        schemas: {
          Satellite: {
            type: 'object',
            description: 'Every satellite in the Scalar Galaxy',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              diameter: { type: 'number', description: 'Diameter in kilometers' },
            },
          },
        },
      },
    } as unknown as Partial<OpenApiDocument>

    const result = search('diameter', document)

    expect(result[0]?.item?.type).toEqual('model')
    expect(result[0]?.item?.title).toEqual('Satellite')
  })

  it('finds operations whose body schema is a oneOf of $ref-ed object schemas', () => {
    // Mirrors the Galaxy spec's "Create a celestial body" endpoint: the request body schema is a
    // top-level `oneOf` of two `$ref`-ed object schemas. A property defined inside one branch
    // (e.g. `failureCallbackUrl` on `Planet`) should still surface the operation in search.
    const planet = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        failureCallbackUrl: { type: 'string' },
      },
    }
    const satellite = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        orbitalPeriod: { type: 'number' },
      },
    }

    const document = {
      paths: {
        '/celestial-bodies': {
          post: {
            summary: 'Create a celestial body',
            operationId: 'createCelestialBody',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { $ref: '#/components/schemas/Planet', '$ref-value': planet },
                      { $ref: '#/components/schemas/Satellite', '$ref-value': satellite },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    } as unknown as Partial<OpenApiDocument>

    const result = search('failureCallbackUrl', document)

    expect(result[0]?.item?.title).toEqual('Create a celestial body')
  })
})
