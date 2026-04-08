import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  generateNextJsOpenApiDocument,
  getOpenApiPathFromNextJsRouteFile,
  getPathItemFromNextJsSourceFile,
} from './nextjs'
import { createProgramFromFileSystem } from './program'

describe('nextjs', () => {
  const fixtureRoot = path.join(import.meta.dirname, '../test/fixtures/nextjs-app')
  const apiDirectory = path.join(fixtureRoot, 'app/api')
  const userRouteFile = path.join(apiDirectory, 'users/[id]/route.ts')

  it('converts nextjs route file path into openapi path', () => {
    const openApiPath = getOpenApiPathFromNextJsRouteFile(userRouteFile, apiDirectory)
    expect(openApiPath).toBe('/users/{id}')
  })

  it('extracts path operations from a route source file', () => {
    const program = createProgramFromFileSystem({ rootDirectory: apiDirectory })
    const sourceFile = program.getSourceFile(userRouteFile)

    expect(sourceFile).toBeDefined()
    if (!sourceFile) {
      return
    }

    const pathItem = getPathItemFromNextJsSourceFile(sourceFile, program)

    expect(pathItem).toStrictEqual({
      get: {
        summary: 'Get user by id',
        description: 'Returns user details by path parameter.',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: 'user_1',
                    },
                    name: {
                      type: 'string',
                      example: 'Ada Lovelace',
                    },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete user by id',
        description: 'Deletes the user and returns no payload.',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '204': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: {
              'application/json': {
                schema: {
                  type: 'null',
                  example: null,
                },
              },
            },
          },
        },
      },
    })
  })

  it('generates an openapi document from nextjs api routes', () => {
    const document = generateNextJsOpenApiDocument({
      cwd: fixtureRoot,
      info: {
        title: 'Fixture API',
        version: '1.2.3',
      },
      servers: [{ url: 'https://example.com' }],
    })

    expect(document).toStrictEqual({
      openapi: '3.1.0',
      info: {
        title: 'Fixture API',
        version: '1.2.3',
        description: 'Generated from Next.js route handlers',
        summary: undefined,
        termsOfService: undefined,
        contact: undefined,
        license: undefined,
      },
      servers: [{ url: 'https://example.com' }],
      paths: {
        '/posts': {
          post: {
            summary: 'Create post',
            description: 'use jsdoc tag to set the description',
            responses: {
              '201': {
                description: 'TODO: grab this from jsdoc and add a default',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        ok: {
                          type: 'boolean',
                          example: true,
                        },
                        postId: {
                          type: 'number',
                          example: 10,
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
            summary: 'Get user by id',
            description: 'Returns user details by path parameter.',
            parameters: [
              {
                in: 'path',
                name: 'id',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'TODO: grab this from jsdoc and add a default',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          example: 'user_1',
                        },
                        name: {
                          type: 'string',
                          example: 'Ada Lovelace',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          delete: {
            summary: 'Delete user by id',
            description: 'Deletes the user and returns no payload.',
            parameters: [
              {
                in: 'path',
                name: 'id',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '204': {
                description: 'TODO: grab this from jsdoc and add a default',
                content: {
                  'application/json': {
                    schema: {
                      type: 'null',
                      example: null,
                    },
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
