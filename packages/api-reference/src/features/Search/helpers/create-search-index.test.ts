import type { AsyncApiComponentsObject, AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createNavigation, traverseAsyncApiDocument } from '@scalar/workspace-store/navigation'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createFuseInstance } from './create-fuse-instance'
import { createSearchIndex } from './create-search-index'

/** Navigation always includes a default Introduction text entry (see workspace-store). */
const introductionSearchEntry = {
  type: 'heading',
  title: 'Introduction',
  description: 'Heading',
  body: '',
  id: 'test/description/introduction',
  entry: {
    id: 'test/description/introduction',
    title: 'Introduction',
    type: 'text',
  },
} as const

function createMockDocument(document: Partial<OpenApiDocument>) {
  const doc = {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    ...document,
  } as OpenApiDocument

  doc['x-scalar-navigation'] = createNavigation('test', doc, { hideModels: false })

  return doc
}

describe('createSearchIndex', () => {
  it('reindexes shared models and request bodies after in-place schema edits', () => {
    const schema = { type: 'object' as const, properties: { name: { type: 'string' as const, description: 'Before' } } }
    const document = createMockDocument({
      components: { schemas: { First: schema, Second: schema } },
      paths: {
        '/first': { post: { requestBody: { content: { 'application/json': { schema } } } } },
        '/second': { post: { requestBody: { content: { 'application/json': { schema } } } } },
      },
    })
    const fields = (): unknown[] =>
      createSearchIndex(document)
        .filter((entry) => entry.type === 'model' || entry.type === 'operation')
        .map((entry) => ({ names: entry.body, descriptions: entry.bodyDescriptions }))
    expect(fields()).toStrictEqual(Array.from({ length: 4 }, () => ({ names: ['name'], descriptions: ['Before'] })))
    schema.properties.name.description = 'After'
    expect(fields()).toStrictEqual(Array.from({ length: 4 }, () => ({ names: ['name'], descriptions: ['After'] })))
  })

  it('reindexes AsyncAPI model fields after in-place edits', () => {
    const schema = {
      type: 'object',
      properties: { planet: { type: 'string', description: 'Before' } },
    } satisfies NonNullable<AsyncApiComponentsObject['schemas']>[string]
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: { title: 'Streaming API', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      components: { schemas: { Event: schema } },
    }
    document['x-scalar-navigation'] = traverseAsyncApiDocument('test', document)
    const fields = (): unknown[] =>
      createSearchIndex(document)
        .filter((entry) => entry.type === 'model')
        .map((entry) => ({ names: entry.body, descriptions: entry.bodyDescriptions }))
    expect(fields()).toStrictEqual([{ names: ['planet'], descriptions: ['Before'] }])
    schema.properties.planet.description = 'After'
    expect(fields()).toStrictEqual([{ names: ['planet'], descriptions: ['After'] }])
  })

  describe('operations', () => {
    it('adds a single operation', () => {
      const document = {
        paths: {
          '/users': {
            get: {
              summary: 'Get Users',
            },
          },
        },
      }

      const index = createSearchIndex(createMockDocument(document))

      expect(index.length).toEqual(2)

      expect(index).toMatchObject([introductionSearchEntry, { title: 'Get Users' }])
    })

    it('adds operation with description and operationId', () => {
      const document = {
        paths: {
          '/users': {
            post: {
              operationId: 'createUser',
              summary: 'Create User',
              description: 'Creates a new user in the system',
            },
          },
        },
      }

      const index = createSearchIndex(createMockDocument(document))

      expect(index).toMatchObject([
        introductionSearchEntry,
        {
          type: 'operation',
          title: 'Create User',
          operationId: 'createUser',
          description: 'Creates a new user in the system',
          method: 'post',
          path: '/users',
        },
      ])
    })

    it('adds operation with empty description', () => {
      const document = {
        paths: {
          '/users': {
            delete: {
              summary: 'Delete User',
            },
          },
        },
      }

      const index = createSearchIndex(createMockDocument(document))

      expect(index).toMatchObject([
        introductionSearchEntry,
        {
          type: 'operation',
          title: 'Delete User',
          description: '',
          method: 'delete',
          path: '/users',
        },
      ])
    })

    it('adds multiple operations', () => {
      const document = {
        paths: {
          '/users': {
            get: {
              summary: 'Get Users',
            },
            post: {
              summary: 'Create User',
            },
          },
          '/posts': {
            get: {
              summary: 'Get Posts',
            },
          },
        },
      }

      const index = createSearchIndex(createMockDocument(document))

      expect(index.length).toEqual(4)
      expect(index.map((item) => item.title)).toEqual(['Introduction', 'Get Users', 'Create User', 'Get Posts'])
    })

    it('includes path item parameter names and descriptions in the operation index', () => {
      const document = createMockDocument({
        paths: {
          '/users/{userId}': {
            parameters: [
              {
                in: 'path',
                name: 'userId',
                required: true,
                description: 'Unique user identifier',
              },
            ],
            get: {
              summary: 'Get User',
            },
          },
        },
      })

      const index = createSearchIndex(document)
      const operationEntry = index.find((item) => item.type === 'operation')

      expect(operationEntry).toMatchObject({
        type: 'operation',
        title: 'Get User',
        body: [],
        parameters: ['userId'],
        parameterDescriptions: ['Unique user identifier'],
      })
    })

    it('includes request body from application/json in operation index', () => {
      const document = createMockDocument({
        paths: {
          '/users': {
            post: {
              summary: 'Create User',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        email: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      const index = createSearchIndex(document)
      const operationEntry = index.find((item) => item.type === 'operation')

      expect(operationEntry).toMatchObject({
        type: 'operation',
        title: 'Create User',
        body: ['name', 'email'],
      })
    })

    it('includes request body from non-json content types in operation index', () => {
      const document = createMockDocument({
        paths: {
          '/users': {
            post: {
              summary: 'Create User',
              requestBody: {
                content: {
                  'application/xml': {
                    schema: {
                      type: 'object',
                      properties: {
                        xmlField: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      const index = createSearchIndex(document)
      const operationEntry = index.find((item) => item.type === 'operation')

      expect(operationEntry).toMatchObject({
        type: 'operation',
        title: 'Create User',
        body: ['xmlField'],
      })
    })

    it('includes request body from multiple content types in operation index', () => {
      const document = createMockDocument({
        paths: {
          '/users': {
            post: {
              summary: 'Create User',
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
                  'application/xml': {
                    schema: {
                      type: 'object',
                      properties: {
                        xmlField: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      const index = createSearchIndex(document)
      const operationEntry = index.find((item) => item.type === 'operation')

      expect(operationEntry).toMatchObject({
        type: 'operation',
        title: 'Create User',
        body: ['jsonField', 'xmlField'],
      })
    })

    it('falls back to parameter map when no request body is present', () => {
      const document = createMockDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get Users',
              parameters: [
                {
                  in: 'query',
                  name: 'limit',
                  description: 'Number of users to return',
                },
              ],
            },
          },
        },
      })

      const index = createSearchIndex(document)
      const operationEntry = index.find((item) => item.type === 'operation')

      expect(operationEntry).toEqual({
        type: 'operation',
        title: 'Get Users',
        parameters: ['limit'],
        parameterDescriptions: ['Number of users to return'],
        path: '/users',
        method: 'get',
        responseExamples: [],
        body: [],
        bodyDescriptions: [],
        description: '',
        entry: expect.any(Object),
        id: expect.any(String),
        operationId: undefined,
      })
    })

    it('includes operation response examples in the index', () => {
      const document = createMockDocument({
        paths: {
          '/users/{userId}': {
            get: {
              summary: 'Get User',
              responses: {
                200: {
                  description: 'Successful response',
                  content: {
                    'application/json': {
                      example: {
                        source: 'success-response-example',
                        userId: 'user_123',
                      },
                    },
                  },
                },
                400: {
                  description: 'Bad request',
                  content: {
                    'application/json': {
                      examples: {
                        invalidRequest: {
                          value: {
                            source: 'bad-request-example',
                            message: 'Request is invalid',
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

      const index = createSearchIndex(document)
      const operationEntry = index.find((item) => item.type === 'operation')

      expect(operationEntry).toMatchObject({
        type: 'operation',
        title: 'Get User',
        responseExamples: [
          '{"source":"success-response-example","userId":"user_123"}',
          '{"source":"bad-request-example","message":"Request is invalid"}',
        ],
      })
    })
  })

  describe('schemas', () => {
    it('adds a single schema with property names and descriptions', () => {
      const index = createSearchIndex(
        createMockDocument({
          components: {
            schemas: {
              User: {
                type: 'object',
                title: 'User Model',
                description: 'A user object',
                properties: {
                  name: { type: 'string', description: 'Display name' },
                  email: { type: 'string' },
                },
              },
            },
          },
        }),
      )

      expect(index).toMatchObject([
        introductionSearchEntry,
        {
          type: 'heading',
          title: 'Models',
          description: 'Heading',
        },
        {
          title: 'User Model',
          description: 'Models',
          body: ['name', 'email'],
          bodyDescriptions: ['A user object', 'Display name'],
        },
      ])

      expect(index.length).toEqual(3)
    })

    it('adds schema without description or properties', () => {
      const index = createSearchIndex(
        createMockDocument({
          components: {
            schemas: {
              Post: {
                type: 'object',
                title: 'Post Model',
              },
            },
          },
        }),
      )

      expect(index).toMatchObject([
        introductionSearchEntry,
        {
          type: 'heading',
          title: 'Models',
          description: 'Heading',
        },
        {
          title: 'Post Model',
          description: 'Models',
          body: [],
          bodyDescriptions: [],
        },
      ])
    })

    it('adds multiple schemas', () => {
      const index = createSearchIndex(
        createMockDocument({
          components: {
            schemas: {
              User: {
                type: 'object',
                title: 'User Model',
                description: 'A user object',
              },
              Post: {
                type: 'object',
                title: 'Post Model',
                description: 'A post object',
              },
            },
          },
        }),
      )

      expect(index.length).toEqual(4) // Introduction + models heading + 2 schemas
      expect(index[0]).toMatchObject({ type: 'heading', title: 'Introduction' })
      expect(index[1]).toMatchObject({ type: 'heading', title: 'Models' })
      expect(index[2]).toMatchObject({ title: 'User Model', bodyDescriptions: ['A user object'] })
      expect(index[3]).toMatchObject({ title: 'Post Model', bodyDescriptions: ['A post object'] })
    })

    it('uses Schemas labels when modelsSectionLabel is Schemas', () => {
      const doc = createMockDocument({
        components: {
          schemas: {
            User: {
              type: 'object',
              title: 'User Model',
              description: 'A user object',
            },
          },
        },
      })

      doc['x-scalar-navigation'] = createNavigation('test', doc, {
        hideModels: false,
        modelsSectionLabel: 'Schemas',
      })

      const index = createSearchIndex(doc, { modelsSectionLabel: 'Schemas' })

      expect(index[1]).toMatchObject({
        type: 'heading',
        title: 'Schemas',
        description: 'Heading',
      })
      expect(index[2]).toMatchObject({
        title: 'User Model',
        description: 'Schemas',
      })
    })

    it('collects property names through a oneOf model schema', () => {
      // Mirrors the Galaxy spec's CelestialBody — top-level oneOf of two $ref-ed object schemas.
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
          diameter: { type: 'number' },
        },
      }
      const document = createMockDocument({
        components: {
          schemas: {
            Planet: planet,
            Satellite: satellite,
            CelestialBody: {
              title: 'CelestialBody',
              oneOf: [
                { $ref: '#/components/schemas/Planet', '$ref-value': planet },
                { $ref: '#/components/schemas/Satellite', '$ref-value': satellite },
              ],
            },
          },
        },
      } as unknown as Partial<OpenApiDocument>)

      const index = createSearchIndex(document)
      const celestialEntry = index.find((item) => item.type === 'model' && item.title === 'CelestialBody')

      expect(celestialEntry?.body).toEqual(['name', 'failureCallbackUrl', 'diameter'])
    })
  })

  describe('webhooks', () => {
    it('adds a single webhook', () => {
      const document = createMockDocument({
        webhooks: {
          userCreated: {
            post: {
              summary: 'User Created Webhook',
            },
          },
        },
      })

      const index = createSearchIndex(document)

      expect(index).toMatchObject([
        introductionSearchEntry,
        {
          type: 'heading',
          title: 'Webhooks',
          description: 'Heading',
        },
        {
          type: 'webhook',
          method: 'post',
          title: 'User Created Webhook',
          description: 'Webhook',
        },
      ])

      expect(index.length).toEqual(3)
    })

    it('adds webhook with description', () => {
      const document = {
        webhooks: {
          userDeleted: {
            delete: {
              summary: 'User Deleted Webhook',
              description: 'Triggered when a user is deleted',
            },
          },
        },
      }

      const index = createSearchIndex(createMockDocument(document))

      expect(index).toMatchObject([
        introductionSearchEntry,
        {
          type: 'heading',
          title: 'Webhooks',
          description: 'Heading',
        },
        {
          type: 'webhook',
          method: 'delete',
          title: 'User Deleted Webhook',
          description: 'Webhook',
          body: '',
          bodyDescriptions: ['Triggered when a user is deleted'],
        },
      ])
    })

    it('adds webhook without description', () => {
      const document = {
        webhooks: {
          userUpdated: {
            put: {
              summary: 'User Updated Webhook',
            },
          },
        },
      }

      const index = createSearchIndex(createMockDocument(document))

      expect(index).toMatchObject([
        introductionSearchEntry,
        {
          type: 'heading',
          title: 'Webhooks',
          description: 'Heading',
        },
        {
          type: 'webhook',
          method: 'put',
          title: 'User Updated Webhook',
          description: 'Webhook',
          body: '',
          bodyDescriptions: [],
        },
      ])
    })
  })

  describe('tags', () => {
    it('adds a single tag', () => {
      const document = createMockDocument({
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
              summary: 'Get Users',
            },
          },
        },
      })

      const index = createSearchIndex(document)

      // Should include the tag and the operation
      expect(index.length).toBeGreaterThanOrEqual(2)

      const tagEntry = index.find((item) => item.type === 'tag' && item.title === 'Users')
      expect(tagEntry).toMatchObject({
        type: 'tag',
        title: 'Users',
        description: 'User management operations',
        body: '',
      })
    })

    it('adds tag without description', () => {
      const document = createMockDocument({
        tags: [
          {
            name: 'Posts',
          },
        ],
        paths: {
          '/posts': {
            get: {
              tags: ['Posts'],
              summary: 'Get Posts',
            },
          },
        },
      })

      const index = createSearchIndex(document)

      const tagEntry = index.find((item) => item.type === 'tag' && item.title === 'Posts')
      expect(tagEntry).toMatchObject({
        type: 'tag',
        title: 'Posts',
        description: '',
        body: '',
      })
    })

    it('adds tag group', () => {
      const document = createMockDocument({
        tags: [
          {
            name: 'User Management',
            description: 'User management operations',
          },
        ],
        paths: {
          '/users': {
            get: {
              tags: ['User Management'],
              summary: 'Get Users',
            },
          },
        },
      })

      const index = createSearchIndex(document)

      const tagGroupEntry = index.find((item) => item.type === 'tag' && item.title === 'User Management')
      expect(tagGroupEntry).toMatchObject({
        type: 'tag',
        title: 'User Management',
        description: 'User management operations',
        body: '',
      })
    })

    it('labels a legacy x-tagGroups wrapper as a tag group', () => {
      const document = createMockDocument({
        tags: [{ name: 'Users' }],
        'x-tagGroups': [{ name: 'Administration', tags: ['Users'] }],
        paths: {
          '/users': {
            get: {
              tags: ['Users'],
              summary: 'Get Users',
            },
          },
        },
      })

      const index = createSearchIndex(document)

      const groupEntry = index.find((item) => item.type === 'tag' && item.title === 'Administration')
      expect(groupEntry).toMatchObject({
        type: 'tag',
        title: 'Administration',
        description: 'Tag Group',
      })
    })

    it('keeps the description of an OpenAPI 3.2 operation-less parent tag', () => {
      const document = createMockDocument({
        tags: [
          { name: 'Galaxy', description: 'Everything about the galaxy' },
          { name: 'Planets', parent: 'Galaxy' },
        ],
        paths: {
          '/planets': {
            get: {
              tags: ['Planets'],
              summary: 'List planets',
            },
          },
        },
      })

      const index = createSearchIndex(document)

      // The parent is a real tag section, not a legacy x-tagGroups wrapper, so it keeps
      // its own description instead of the generic "Tag Group" label.
      const parentEntry = index.find((item) => item.type === 'tag' && item.title === 'Galaxy')
      expect(parentEntry).toMatchObject({
        type: 'tag',
        title: 'Galaxy',
        description: 'Everything about the galaxy',
      })
    })
  })

  describe('document info', () => {
    it('adds headings from the description', () => {
      const document = createMockDocument({
        info: {
          description: '# API Documentation\nThis is the API documentation.',
        },
      } as OpenApiDocument)

      const index = createSearchIndex(document)

      expect(index).toMatchObject([
        {
          type: 'heading',
          title: 'API Documentation',
          description: 'Heading',
        },
      ])

      expect(index.length).toEqual(1)
    })

    it('adds multiple headings from description', () => {
      const document = createMockDocument({
        info: {
          description: '# Introduction\nWelcome to the API.\n\n## Getting Started\nFollow these steps.',
        },
      } as OpenApiDocument)

      const index = createSearchIndex(document)

      expect(index.length).toEqual(2)
      expect(index[0]).toMatchObject({
        type: 'heading',
        title: 'Introduction',
        description: 'Heading',
      })
      expect(index[1]).toMatchObject({
        type: 'heading',
        title: 'Getting Started',
        description: 'Heading',
      })
    })

    it('handles entry with null title', () => {
      const document = createMockDocument({
        info: {
          description: 'Plain text without headings',
        },
      } as OpenApiDocument)

      const index = createSearchIndex(document)

      expect(index).toMatchObject([
        {
          type: 'heading',
          title: 'Introduction',
          description: 'Heading',
        },
      ])

      expect(index.length).toEqual(1)
    })
  })

  describe('mixed content', () => {
    it('handles document with operations, schemas, and webhooks', () => {
      const document = createMockDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get Users',
            },
          },
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              title: 'User Model',
              description: 'A user object',
            },
          },
        },
        webhooks: {
          userCreated: {
            post: {
              summary: 'User Created Webhook',
            },
          },
        },
      })

      const index = createSearchIndex(document)

      const operationEntry = index.find((item) => item.type === 'operation')
      const schemaEntry = index.find((item) => item.type === 'model')
      const webhookEntry = index.find((item) => item.type === 'webhook')

      expect(operationEntry).toBeDefined()
      expect(schemaEntry).toBeDefined()
      expect(webhookEntry).toBeDefined()

      // Introduction + 1 operation + 1 schema + 1 webhook + models heading + webhooks heading
      expect(index.length).toEqual(6)
    })
  })

  describe('recursive processing', () => {
    it('processes nested children entries', () => {
      const document = createMockDocument({
        tags: [
          {
            name: 'User Management',
            description: 'User management operations',
          },
        ],
        paths: {
          '/users': {
            get: {
              tags: ['User Management'],
              summary: 'Get Users',
            },
            post: {
              tags: ['User Management'],
              summary: 'Create User',
            },
          },
        },
      })

      const index = createSearchIndex(document)

      // Should include tag group and both operations
      expect(index.length).toBeGreaterThanOrEqual(3)

      const tagGroupEntry = index.find((item) => item.type === 'tag' && item.title === 'User Management')
      const operationEntries = index.filter((item) => item.type === 'operation')

      expect(tagGroupEntry).toBeDefined()
      expect(operationEntries.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('edge cases', () => {
    it('indexes default Introduction when the document has no operations or models', () => {
      const index = createSearchIndex(createMockDocument({}))
      expect(index).toHaveLength(1)
      expect(index[0]).toMatchObject(introductionSearchEntry)
    })

    it('handles entries with missing properties', () => {
      const document = createMockDocument({
        paths: {
          '/test': {
            get: {
              // No summary
            },
          },
        },
      })

      const index = createSearchIndex(document)
      expect(index.length).toEqual(2)
      expect(index[1]).toMatchObject({
        type: 'operation',
        title: '/test',
        description: '',
      })
    })

    it('handles complex nested structure', () => {
      const document = createMockDocument({
        tags: [
          {
            name: 'Authentication',
            description: 'Auth operations',
          },
          {
            name: 'Users',
            description: 'User operations',
          },
        ],
        paths: {
          '/auth/login': {
            post: {
              tags: ['Authentication'],
              summary: 'Login',
            },
          },
          '/users': {
            get: {
              tags: ['Users'],
              summary: 'Get Users',
            },
            post: {
              tags: ['Users'],
              summary: 'Create User',
            },
          },
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              title: 'User',
              description: 'User model',
            },
            AuthToken: {
              type: 'object',
              title: 'Auth Token',
              description: 'Authentication token',
            },
          },
        },
      })

      const index = createSearchIndex(document)

      // Should include: 2 tag groups + 3 operations + 1 models heading + 2 schemas
      expect(index.length).toBeGreaterThanOrEqual(8)

      const tagEntries = index.filter((item) => item.type === 'tag')
      const operationEntries = index.filter((item) => item.type === 'operation')
      const modelEntries = index.filter((item) => item.type === 'model')

      expect(tagEntries.length).toBeGreaterThanOrEqual(2)
      expect(operationEntries.length).toBeGreaterThanOrEqual(3)
      expect(modelEntries.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('AsyncAPI documents', () => {
    it('indexes the Introduction entry and headings from info.description', () => {
      const document = {
        asyncapi: '3.0.0',
        info: {
          title: 'Streaming API',
          version: '1.0.0',
          description: 'Welcome to the streaming API.\n\n## Getting started\n\nConnect to a channel and subscribe.',
        },
        'x-scalar-original-document-hash': '',
      } as AsyncApiDocument

      document['x-scalar-navigation'] = traverseAsyncApiDocument('test', document)

      const index = createSearchIndex(document)

      const headings = index.filter((item) => item.type === 'heading')
      expect(headings.map((item) => item.title)).toEqual(expect.arrayContaining(['Introduction', 'Getting started']))
    })

    it('indexes components.schemas as models with their property names and descriptions', () => {
      const document = {
        asyncapi: '3.0.0',
        info: { title: 'Streaming API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        components: {
          schemas: {
            PlanetEvent: {
              type: 'object',
              description: 'A planet lifecycle event',
              properties: {
                planetName: { type: 'string', description: 'Name of the planet' },
                eventType: { type: 'string' },
              },
            },
          },
        },
      } as unknown as AsyncApiDocument

      document['x-scalar-navigation'] = traverseAsyncApiDocument('test', document)

      const index = createSearchIndex(document)

      const model = index.find((item) => item.type === 'model' && item.title === 'PlanetEvent')
      expect(model).toBeDefined()
      expect(model?.body).toEqual(expect.arrayContaining(['planetName', 'eventType']))
      expect(model?.bodyDescriptions).toEqual(
        expect.arrayContaining(['A planet lifecycle event', 'Name of the planet']),
      )
    })
  })
  it('searches AsyncAPI content through resolved references and traits', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1.0' },
        channels: {
          planetEvents: {
            address: 'planets/{planetId}/events',
            title: 'Planet Events',
            summary: 'Orbital changes',
            description: 'Celestial notifications',
            parameters: { planetId: { $ref: '#/components/parameters/Planet' } },
            messages: { updated: { $ref: '#/components/messages/Updated' } },
          },
        },
        operations: {
          receiveUpdates: {
            action: 'receive',
            title: 'Watch planets',
            channel: { $ref: '#/channels/planetEvents' },
            traits: [{ $ref: '#/components/operationTraits/Watch' }],
          },
        },
        components: {
          parameters: { Planet: { description: 'Identifier of the observed planet' } },
          operationTraits: { Watch: { description: 'Subscribe to orbital telemetry' } },
          messageTraits: {
            Envelope: {
              description: 'A celestial change envelope',
              headers: {
                type: 'object',
                properties: { traceToken: { type: 'string', description: 'Correlation token' } },
              },
            },
          },
          messages: {
            Updated: {
              title: 'Planet Updated',
              name: 'planetChanged',
              summary: 'Changed orbital properties',
              traits: [{ $ref: '#/components/messageTraits/Envelope' }],
              payload: {
                schemaFormat: 'application/vnd.aai.asyncapi;version=3.1.0',
                schema: {
                  type: 'object',
                  properties: {
                    changes: {
                      type: 'array',
                      items: {
                        allOf: [
                          {
                            type: 'object',
                            properties: {
                              details: {
                                type: 'object',
                                properties: {
                                  orbitRadius: { type: 'number', description: 'Radius of the orbit' },
                                },
                              },
                            },
                          },
                        ],
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
    const document = store.workspace.documents.events
    if (!document || !isAsyncApiDocument(document)) {
      throw new Error('Expected an AsyncAPI document')
    }
    const index = createSearchIndex(document)
    const channel = index.find((item) => item.type === 'asyncapi-channel')
    const operation = index.find((item) => item.type === 'asyncapi-operation')
    const message = index.find((item) => item.type === 'asyncapi-message')
    expect(channel?.parameters).toStrictEqual(['planetId'])
    expect(channel?.parameterDescriptions).toStrictEqual(['Identifier of the observed planet'])
    expect(operation?.description).toBe('Subscribe to orbital telemetry')
    expect(operation?.action).toBe('receive')
    expect(message?.body).toStrictEqual(['changes', 'details', 'orbitRadius', 'traceToken'])
    expect(message?.bodyDescriptions).toStrictEqual([
      'Changed orbital properties',
      'Radius of the orbit',
      'Correlation token',
    ])
    expect(message?.description).toBe('A celestial change envelope')
    const fuse = createFuseInstance()
    fuse.setCollection(index)
    for (const [query, type] of [
      ['planetEvents', 'asyncapi-channel'],
      ['planetId', 'asyncapi-channel'],
      ['receiveUpdates', 'asyncapi-operation'],
      ['telemetry', 'asyncapi-operation'],
      ['planetChanged', 'asyncapi-message'],
      ['orbitRadius', 'asyncapi-message'],
      ['Correlation token', 'asyncapi-message'],
    ] as const) {
      expect(fuse.search(query)[0]?.item.type).toBe(type)
    }
  })

  it('keeps message metadata searchable when schemas are unsupported', () => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Events', version: '1.0' },
      channels: {
        events: {
          address: null,
          messages: {
            avro: {
              title: 'Avro event',
              payload: {
                schemaFormat: 'application/vnd.apache.avro+json',
                schema: { type: 'object', properties: { notJsonSchema: { type: 'string' } } },
              },
            },
            boolean: { title: 'Boolean event', payload: true, headers: false },
            nestedBoolean: { title: 'Nested boolean event', payload: { type: 'array', items: true } },
            missing: { title: 'Missing schema', payload: { $ref: '#/missing' } },
          },
        },
      },
    } as unknown as AsyncApiDocument
    document['x-scalar-navigation'] = traverseAsyncApiDocument('events', document)
    expect(
      createSearchIndex(document)
        .filter((item) => item.type === 'asyncapi-message')
        .map((item) => ({
          title: item.title,
          body: item.body,
          path: item.path,
        })),
    ).toStrictEqual([
      { title: 'Avro event', body: [], path: 'events' },
      { title: 'Boolean event', body: [], path: 'events' },
      { title: 'Missing schema', body: [], path: 'events' },
      { title: 'Nested boolean event', body: [], path: 'events' },
    ])
  })

  it('indexes recursive AsyncAPI payloads without looping', () => {
    const tree: Record<string, unknown> = { type: 'object' }
    tree.properties = { value: { type: 'string', description: 'Node value' }, children: { type: 'array', items: tree } }
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Trees', version: '1.0' },
      channels: { trees: { address: 'trees', messages: { tree: { payload: tree } } } },
    } as unknown as AsyncApiDocument
    document['x-scalar-navigation'] = traverseAsyncApiDocument('trees', document)
    const message = createSearchIndex(document).find((item) => item.type === 'asyncapi-message')
    expect(message?.body).toStrictEqual(['value', 'children'])
    expect(message?.bodyDescriptions).toStrictEqual(['Node value'])
  })
})
