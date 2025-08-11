import { describe, expect, it } from 'vitest'

import { traverseDocument } from '@/features/traverse-schema'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import { ref } from 'vue'
import { createFuseInstance } from './helpers/create-fuse-instance'
import { createSearchIndex } from './helpers/create-search-index'

function search(query: string, document: Partial<OpenAPIV3_1.Document>) {
  const { entries } = traverseDocument(document, {
    config: ref(apiReferenceConfigurationSchema.parse({ hideModels: false })),
    getHeadingId: () => '',
    getOperationId: () => '',
    getWebhookId: () => '',
    getModelId: () => '',
    getTagId: () => '',
    getSectionId: () => '',
  })

  const fuse = createFuseInstance()

  fuse.setCollection(createSearchIndex(entries))

  return fuse.search(query)
}

describe('search quality', () => {
  it('looks up operations by summary', () => {
    const query = 'Get a token'

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    expect(result[0]?.item?.id).toEqual('getToken')
    expect(result[0]?.item?.title).toEqual('Get a token')
  })

  it('finds operations by HTTP method', () => {
    const query = 'POST'

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
      info: {
        title: 'API Reference',
        description: 'This is a test API',
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {}

    const result = search(query, document)

    expect(result).toHaveLength(0)
  })

  it.todo('handles complex nested schemas', () => {
    const query = 'address'

    const document: Partial<OpenAPIV3_1.Document> = {
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

    const document: Partial<OpenAPIV3_1.Document> = {
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

    expect(result).toHaveLength(1)
    expect(result[0]?.item?.title).toEqual('Register user')
  })
})
