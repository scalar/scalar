import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'
import { getWebhooks } from './get-webhooks'

describe('get-webhooks', () => {
  it('returns empty object when no content is provided', () => {
    const result = getWebhooks()
    expect(result).toEqual({})
  })

  it('returns empty object when content has no webhooks', () => {
    const EXAMPLE_DOCUMENT = {} as OpenAPIV3_1.Document
    const result = getWebhooks(EXAMPLE_DOCUMENT)
    expect(result).toEqual({})
  })

  it('returns webhooks from OpenAPI 3.x document', () => {
    const EXAMPLE_DOCUMENT = {
      webhooks: {
        'user.created': {
          post: {
            operationId: 'userCreated',
            summary: 'User created webhook',
          },
        },
        'user.updated': {
          put: {
            operationId: 'userUpdated',
            summary: 'User updated webhook',
          },
        },
      },
    } as OpenAPIV3_1.Document

    const result = getWebhooks(EXAMPLE_DOCUMENT)

    expect(result).toEqual({
      'user.created': {
        post: {
          operationId: 'userCreated',
          summary: 'User created webhook',
        },
      },
      'user.updated': {
        put: {
          operationId: 'userUpdated',
          summary: 'User updated webhook',
        },
      },
    })
  })

  it('filters webhooks based on provided filter function', () => {
    const EXAMPLE_DOCUMENT = {
      webhooks: {
        'user.created': {
          post: {
            operationId: 'userCreated',
            summary: 'User created webhook',
            tags: ['user'],
          },
        },
        'user.updated': {
          put: {
            operationId: 'userUpdated',
            summary: 'User updated webhook',
            tags: ['admin'],
          },
        },
      },
    } as OpenAPIV3_1.Document

    const filter = (webhook: OpenAPIV3_1.PathItemObject) => {
      const operation = webhook as OpenAPIV3_1.OperationObject
      return operation.tags?.includes('user') ?? false
    }

    const result = getWebhooks(EXAMPLE_DOCUMENT, { filter })

    expect(result).toEqual({
      'user.created': {
        post: {
          operationId: 'userCreated',
          summary: 'User created webhook',
          tags: ['user'],
        },
      },
    })
  })

  it('handles webhooks with multiple HTTP methods', () => {
    const EXAMPLE_DOCUMENT = {
      webhooks: {
        'user.events': {
          post: {
            operationId: 'userCreated',
            summary: 'User created webhook',
          },
          put: {
            operationId: 'userUpdated',
            summary: 'User updated webhook',
          },
          delete: {
            operationId: 'userDeleted',
            summary: 'User deleted webhook',
          },
        },
      },
    } as OpenAPIV3_1.Document

    const result = getWebhooks(EXAMPLE_DOCUMENT)
    expect(result).toEqual({
      'user.events': {
        post: {
          operationId: 'userCreated',
          summary: 'User created webhook',
        },
        put: {
          operationId: 'userUpdated',
          summary: 'User updated webhook',
        },
        delete: {
          operationId: 'userDeleted',
          summary: 'User deleted webhook',
        },
      },
    })
  })
})
