import { createNavigation } from '@scalar/workspace-store/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createSearchIndex } from './create-search-index'

function createMockDocument(document: Partial<OpenApiDocument>) {
  const doc = {
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    ...document,
  } as OpenApiDocument

  doc['x-scalar-navigation'] = createNavigation('test', doc, {
    'x-scalar-reference-config': {
      features: {
        showModels: true,
      },
    },
  })

  return doc
}

describe('createSearchIndex', () => {
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

      expect(index.length).toEqual(1)

      expect(index).toMatchObject([
        {
          title: 'Get Users',
        },
      ])
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

      expect(index.length).toEqual(3)
      expect(index.map((item) => item.title)).toEqual(['Get Users', 'Create User', 'Get Posts'])
    })
  })

  describe('schemas', () => {
    it('adds a single schema', () => {
      const index = createSearchIndex(
        createMockDocument({
          components: {
            schemas: {
              User: {
                type: 'object',
                title: 'User Model',
                description: 'A user object',
              },
            },
          },
        }),
      )

      expect(index).toMatchObject([
        {
          type: 'heading',
          title: 'Models',
          description: 'Heading',
        },
        {
          title: 'User Model',
          description: 'Model',
          body: 'A user object',
        },
      ])

      expect(index.length).toEqual(2)
    })

    it('adds schema without description', () => {
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
        {
          type: 'heading',
          title: 'Models',
          description: 'Heading',
        },
        {
          title: 'Post Model',
          description: 'Model',
          body: '',
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

      expect(index.length).toEqual(3) // 1 heading + 2 schemas
      expect(index[0]).toMatchObject({ type: 'heading', title: 'Models' })
      expect(index[1]).toMatchObject({ title: 'User Model', body: 'A user object' })
      expect(index[2]).toMatchObject({ title: 'Post Model', body: 'A post object' })
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

      expect(index.length).toEqual(2)
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
          body: 'Triggered when a user is deleted',
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

      // 1 operation + 1 schema + 1 webhook + 1 models heading + 1 webhooks heading
      expect(index.length).toEqual(5)
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
    it('handles empty entries array', () => {
      const index = createSearchIndex(createMockDocument({}))
      expect(index).toEqual([])
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
      expect(index.length).toEqual(1)
      expect(index[0]).toMatchObject({
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
})
