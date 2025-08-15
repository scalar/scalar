import { join } from '@/utils/join/join'
import { describe, expect, it } from 'vitest'

describe('join', () => {
  it('should handle joining info objects, prioritizing the first input document', async () => {
    const result = await join([
      {
        info: {
          title: 'Main title',
          version: '1.1.1',
        },
      },
      {
        info: {
          title: 'Second title',
          version: '1.43.1',
          summary: 'Some extra information about the API',
        },
      },
      {
        info: {
          title: 'Third title',
          version: '1.3.1',
          summary: 'This will be overridden',
        },
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {
          title: 'Main title',
          version: '1.1.1',
          summary: 'Some extra information about the API',
        },
        paths: {},
      },
    })
  })

  it('should merge path operations correctly', async () => {
    const result = await join([
      {
        paths: {
          '/': {
            get: {
              description: 'Get your feed',
            },
          },
        },
      },
      {
        paths: {
          '/': {
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {
          '/': {
            get: {
              description: 'Get your feed',
            },
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
      },
    })
  })

  it('should return conflicts when there is conflicts on the paths', async () => {
    const result = await join([
      {
        paths: {
          '/': {
            get: {
              description: 'Get your feed',
            },
          },
        },
      },
      {
        paths: {
          '/': {
            get: {
              description: 'Get the list of all post',
            },
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
        webhooks: {},
      },
    ])

    expect(result).toEqual({
      ok: false,
      conflicts: [
        {
          type: 'path',
          method: 'get',
          path: '/',
        },
      ],
    })
  })

  it('should merge webhooks correctly', async () => {
    const result = await join([
      {
        webhooks: {
          '/': {
            get: {
              description: 'Get your feed',
            },
          },
        },
      },
      {
        webhooks: {
          '/': {
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        webhooks: {
          '/': {
            get: {
              description: 'Get your feed',
            },
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
      },
    })
  })

  it('should return conflicts when there are conflicts on webhooks', async () => {
    const result = await join([
      {
        webhooks: {
          '/': {
            get: {
              description: 'Get your feed',
            },
          },
        },
      },
      {
        webhooks: {
          '/': {
            get: {
              description: 'Get the list of all post',
            },
            post: {
              description: 'create a new post',
            },
          },
          '/users': {
            post: {
              description: 'create a new user',
            },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: false,
      conflicts: [
        {
          type: 'webhook',
          method: 'get',
          path: '/',
        },
      ],
    })
  })

  it('should merge tags', async () => {
    const result = await join([
      {
        tags: [
          {
            name: 'tag-1',
            description: 'some tag1 description',
          },
          {
            name: 'tag-2',
            description: 'some tag2 description',
          },
        ],
      },
      {
        tags: [
          {
            name: 'tag-1',
            description: 'some tag1 description',
          },
          {
            name: 'tag-3',
            description: 'some tag3 description',
          },
        ],
      },
      {
        tags: [
          {
            name: 'tag-4',
            description: 'some tag4 description',
          },
          {
            name: 'tag-3',
            description: 'some tag3 description',
          },
        ],
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        tags: [
          {
            description: 'some tag4 description',
            name: 'tag-4',
          },
          {
            description: 'some tag3 description',
            name: 'tag-3',
          },
          {
            description: 'some tag1 description',
            name: 'tag-1',
          },
          {
            description: 'some tag2 description',
            name: 'tag-2',
          },
        ],
      },
    })
  })

  it('should merge servers', async () => {
    const result = await join([
      {
        servers: [
          {
            url: 'server-1',
            description: 'some server1 description',
          },
          {
            url: 'server-2',
            description: 'some server2 description',
          },
        ],
      },
      {
        servers: [
          {
            url: 'server-1',
            description: 'some server1 description',
          },
          {
            url: 'server-3',
            description: 'some server3 description',
          },
        ],
      },
      {
        servers: [
          {
            url: 'server-4',
            description: 'some server4 description',
          },
          {
            url: 'server-3',
            description: 'some server3 description',
          },
        ],
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        servers: [
          {
            description: 'some server4 description',
            url: 'server-4',
          },
          {
            description: 'some server3 description',
            url: 'server-3',
          },
          {
            description: 'some server1 description',
            url: 'server-1',
          },
          {
            description: 'some server2 description',
            url: 'server-2',
          },
        ],
      },
    })
  })

  it('should merge all component types correctly', async () => {
    const result = await join([
      {
        components: {
          schemas: {
            User: { type: 'object', properties: { name: { type: 'string' } } },
          },
          responses: {
            UserResponse: { description: 'User response' },
          },
          parameters: {
            UserId: { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          },
          examples: {
            UserExample: { summary: 'User example' },
          },
          requestBodies: {
            UserRequest: { content: { 'application/json': { schema: { type: 'object' } } } },
          },
          headers: {
            UserHeader: { description: 'User header' },
          },
          securitySchemes: {
            ApiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          },
          links: {
            UserLink: { operationId: 'getUser' },
          },
          callbacks: {
            UserCallback: { '{$request.body#/url}': { post: { summary: 'Callback' } } },
          },
          pathItems: {
            UserPath: { get: { summary: 'Get user' } },
          },
        },
      },
      {
        components: {
          schemas: {
            Product: { type: 'object', properties: { title: { type: 'string' } } },
          },
          responses: {
            ProductResponse: { description: 'Product response' },
          },
          parameters: {
            ProductId: { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        components: {
          schemas: {
            User: { type: 'object', properties: { name: { type: 'string' } } },
            Product: { type: 'object', properties: { title: { type: 'string' } } },
          },
          responses: {
            UserResponse: { description: 'User response' },
            ProductResponse: { description: 'Product response' },
          },
          parameters: {
            UserId: { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ProductId: { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          },
          examples: {
            UserExample: { summary: 'User example' },
          },
          requestBodies: {
            UserRequest: { content: { 'application/json': { schema: { type: 'object' } } } },
          },
          headers: {
            UserHeader: { description: 'User header' },
          },
          securitySchemes: {
            ApiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          },
          links: {
            UserLink: { operationId: 'getUser' },
          },
          callbacks: {
            UserCallback: { '{$request.body#/url}': { post: { summary: 'Callback' } } },
          },
          pathItems: {
            UserPath: { get: { summary: 'Get user' } },
          },
        },
      },
    })
  })

  it('should handle conflicts in components', async () => {
    const result = await join([
      {
        components: {
          schemas: {
            Schema1: {
              type: 'object',
              properties: {
                prop1: { type: 'string' },
              },
            },
          },
        },
      },
      {
        components: {
          schemas: {
            Schema1: {
              type: 'object',
              properties: {
                prop2: { type: 'string' },
              },
            },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: false,
      conflicts: [
        {
          componentType: 'schemas',
          name: 'Schema1',
          type: 'component',
        },
      ],
    })
  })

  it('should prefix schemas so there are no conflicts', async () => {
    const result = await join(
      [
        {
          components: {
            schemas: {
              Schema1: {
                type: 'object',
                properties: {
                  prop1: { type: 'string' },
                },
              },
              Schema2: {
                type: 'object',
                properties: {
                  prop1: { type: 'string' },
                },
              },
              Schema3: {
                type: 'object',
                properties: {
                  prop1: { type: 'string' },
                },
              },
            },
          },
        },
        {
          components: {
            schemas: {
              Schema1: {
                type: 'object',
                properties: {
                  prop2: { type: 'string' },
                },
              },
            },
          },
        },
      ],
      { prefixComponents: ['prefix1-', 'prefix2-'] },
    )

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        components: {
          schemas: {
            'prefix1-Schema1': {
              type: 'object',
              properties: {
                prop1: { type: 'string' },
              },
            },
            'prefix1-Schema2': {
              type: 'object',
              properties: {
                prop1: { type: 'string' },
              },
            },
            'prefix1-Schema3': {
              type: 'object',
              properties: {
                prop1: { type: 'string' },
              },
            },
            'prefix2-Schema1': {
              type: 'object',
              properties: {
                prop2: { type: 'string' },
              },
            },
          },
        },
      },
    })
  })

  it('should update the references to the prefixed schemas', async () => {
    const result = await join(
      [
        {
          $defs: {
            someKey: { $ref: '#/components/schemas/Schema1' },
          },
          components: {
            schemas: {
              Schema1: {
                type: 'object',
                properties: {
                  prop1: { type: 'string' },
                },
              },
            },
          },
        },
        {
          paths: {
            '/example': {
              get: {
                responses: {
                  '200': {
                    description: 'Success',
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/Schema2' },
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            schemas: {
              Schema2: {
                type: 'object',
                properties: {
                  prop2: { type: 'string' },
                },
              },
            },
          },
        },
      ],
      { prefixComponents: ['prefix1-', 'prefix2-'] },
    )

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {
          '/example': {
            get: {
              responses: {
                200: {
                  content: {
                    'application/json': {
                      schema: {
                        '$ref': '#/components/schemas/prefix2-Schema2',
                      },
                    },
                  },
                  description: 'Success',
                },
              },
            },
          },
        },
        components: {
          schemas: {
            'prefix1-Schema1': {
              type: 'object',
              properties: {
                prop1: { type: 'string' },
              },
            },
            'prefix2-Schema2': {
              type: 'object',
              properties: {
                prop2: { type: 'string' },
              },
            },
          },
        },
        '$defs': {
          someKey: {
            '$ref': '#/components/schemas/prefix1-Schema1',
          },
        },
      },
    })
  })

  it('should handle components with undefined or null values', async () => {
    const result = await join([
      {
        components: {
          schemas: {
            Schema1: { type: 'object' },
          },
        },
      },
      {
        components: undefined,
      },
      {
        components: null,
      },
      {
        components: {
          schemas: {
            Schema2: { type: 'string' },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        components: {
          schemas: {
            Schema1: { type: 'object' },
            Schema2: { type: 'string' },
          },
        },
      },
    })
  })

  it('should handle prefix array smaller than input documents array', async () => {
    const result = await join(
      [
        {
          components: {
            schemas: {
              Schema1: { type: 'object', properties: { prop1: { type: 'string' } } },
            },
          },
        },
        {
          components: {
            schemas: {
              Schema2: { type: 'object', properties: { prop2: { type: 'string' } } },
            },
          },
        },
        {
          components: {
            schemas: {
              Schema3: { type: 'object', properties: { prop3: { type: 'string' } } },
            },
          },
        },
      ],
      { prefixComponents: ['prefix1-', 'prefix2-'] }, // Only 2 prefixes for 3 documents
    )

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        components: {
          schemas: {
            'prefix1-Schema1': { type: 'object', properties: { prop1: { type: 'string' } } },
            'prefix2-Schema2': { type: 'object', properties: { prop2: { type: 'string' } } },
            Schema3: { type: 'object', properties: { prop3: { type: 'string' } } }, // No prefix applied
          },
        },
      },
    })
  })

  it('should handle prefix array larger than input documents array', async () => {
    const result = await join(
      [
        {
          components: {
            schemas: {
              Schema1: { type: 'object', properties: { prop1: { type: 'string' } } },
            },
          },
        },
        {
          components: {
            schemas: {
              Schema2: { type: 'object', properties: { prop2: { type: 'string' } } },
            },
          },
        },
      ],
      { prefixComponents: ['prefix1-', 'prefix2-', 'prefix3-', 'prefix4-'] }, // 4 prefixes for 2 documents
    )

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        components: {
          schemas: {
            'prefix1-Schema1': { type: 'object', properties: { prop1: { type: 'string' } } },
            'prefix2-Schema2': { type: 'object', properties: { prop2: { type: 'string' } } },
          },
        },
      },
    })
  })

  it('should handle empty prefix array', async () => {
    const result = await join(
      [
        {
          components: {
            schemas: {
              Schema1: { type: 'object', properties: { prop1: { type: 'string' } } },
            },
          },
        },
        {
          components: {
            schemas: {
              Schema2: { type: 'object', properties: { prop2: { type: 'string' } } },
            },
          },
        },
      ],
      { prefixComponents: [] }, // Empty prefix array
    )

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},
        components: {
          schemas: {
            Schema1: { type: 'object', properties: { prop1: { type: 'string' } } },
            Schema2: { type: 'object', properties: { prop2: { type: 'string' } } },
          },
        },
      },
    })
  })

  it('should handle components with mixed component types and conflicts', async () => {
    const result = await join([
      {
        components: {
          schemas: {
            User: { type: 'object', properties: { name: { type: 'string' } } },
          },
          responses: {
            Error: { description: 'Error response' },
          },
        },
      },
      {
        components: {
          schemas: {
            User: { type: 'object', properties: { email: { type: 'string' } } }, // Conflict with User schema
          },
          responses: {
            Success: { description: 'Success response' },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: false,
      conflicts: [
        {
          type: 'component',
          componentType: 'schemas',
          name: 'User',
        },
      ],
    })
  })

  it('should merge components with deep nested structures', async () => {
    const result = await join([
      {
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                profile: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      {
        components: {
          schemas: {
            Product: {
              type: 'object',
              properties: {
                details: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    price: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    ])

    expect(result).toEqual({
      ok: true,
      document: {
        info: {},
        paths: {},

        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                profile: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                  },
                },
              },
            },
            Product: {
              type: 'object',
              properties: {
                details: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    price: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    })
  })
})
