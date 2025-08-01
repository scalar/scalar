import { apply } from '@/diff/apply'
import { diff } from '@/diff/diff'
import { describe, expect, test } from 'vitest'

describe('if we get list of operations we need to perform A -> B, when we apply them on A it should give us B', () => {
  test.each([
    [
      { name: 'John', age: 25 },
      { name: 'Jeremy', age: 25 },
    ],
    [
      {
        name: 'John',
        age: 25,
        interest: {
          cars: { classics: ['Ferrari 250 GTO', 'Chevrolet Camaro'] },
          music: { pop: ['Bruno Mars', 'Justin Bieber'] },
        },
      },
      {
        name: 'John',
        age: 25,
        interest: {
          cars: { classics: ['Ferrari 250 GTO'] },
          music: { rock: ['Eagles', 'AC/DC'] },
        },
      },
    ],
    [{ version: '1.1.0', name: '@scalar/json-diff' }, {}],
    [
      {
        openapi: '3.0.0',
        info: {
          title: 'Simple API',
          description: 'A small OpenAPI specification example',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get a list of users',
              operationId: 'getUsers',
              responses: {
                '200': {
                  description: 'A list of users',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '/users/{id}': {
            get: {
              summary: 'Get a user by ID',
              operationId: 'getUserById',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'integer' },
                },
              ],
              responses: {
                '200': {
                  description: 'User details',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                        },
                      },
                    },
                  },
                },
                '404': {
                  description: 'User not found',
                },
              },
            },
          },
        },
      },
      {
        openapi: '3.0.0',
        info: {
          title: 'Simple API',
          description: 'A big OpenAPI specification example',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get a list of users',
              operationId: 'getUsers',
              responses: {
                '200': {
                  description: 'A list of users',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
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
      },
    ],
    [{}, {}],
    [
      {},
      {
        openapi: '3.0.0',
        info: {
          title: 'Simple API',
          description: 'A big OpenAPI specification example',
          version: '1.0.0',
        },
      },
    ],
  ])('apply(a, diff(a, b)) === b', (a, b) => {
    expect(apply(a, diff(a, b))).toEqual(b)
  })
})
