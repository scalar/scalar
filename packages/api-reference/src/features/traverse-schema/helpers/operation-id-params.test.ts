import { describe, expect, it } from 'vitest'
import type { TransformedOperation } from '@scalar/types/legacy'
import { operationIdParams } from './operation-id-params'

describe('operationIdParams', () => {
  it('should transform a basic operation correctly', () => {
    const transformedOperation: TransformedOperation = {
      path: '/users',
      httpVerb: 'GET',
      information: {
        summary: 'Get users',
        operationId: 'getUsers',
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }

    const result = operationIdParams(transformedOperation)

    expect(result).toEqual({
      summary: 'Get users',
      operationId: 'getUsers',
      responses: {
        '200': {
          description: 'OK',
        },
      },
      path: '/users',
      method: 'get',
    })
  })

  it('should handle operations with parameters', () => {
    const transformedOperation: TransformedOperation = {
      path: '/users/{id}',
      httpVerb: 'GET',
      information: {
        summary: 'Get user by ID',
        operationId: 'getUserById',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }

    const result = operationIdParams(transformedOperation)

    expect(result).toEqual({
      summary: 'Get user by ID',
      operationId: 'getUserById',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
      path: '/users/{id}',
      method: 'get',
    })
  })

  it('should handle operations with request body', () => {
    const transformedOperation: TransformedOperation = {
      path: '/users',
      httpVerb: 'POST',
      information: {
        summary: 'Create user',
        operationId: 'createUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
          },
        },
      },
    }

    const result = operationIdParams(transformedOperation)

    expect(result).toEqual({
      summary: 'Create user',
      operationId: 'createUser',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Created',
        },
      },
      path: '/users',
      method: 'post',
    })
  })

  it('should handle operations with security requirements', () => {
    const transformedOperation: TransformedOperation = {
      path: '/users/me',
      httpVerb: 'GET',
      information: {
        summary: 'Get current user',
        operationId: 'getCurrentUser',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }

    const result = operationIdParams(transformedOperation)

    expect(result).toEqual({
      summary: 'Get current user',
      operationId: 'getCurrentUser',
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
      path: '/users/me',
      method: 'get',
    })
  })

  it('should handle operations with tags', () => {
    const transformedOperation: TransformedOperation = {
      path: '/users',
      httpVerb: 'GET',
      information: {
        summary: 'Get users',
        operationId: 'getUsers',
        tags: ['users'],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }

    const result = operationIdParams(transformedOperation)

    expect(result).toEqual({
      summary: 'Get users',
      operationId: 'getUsers',
      tags: ['users'],
      responses: {
        '200': {
          description: 'OK',
        },
      },
      path: '/users',
      method: 'get',
    })
  })
})
