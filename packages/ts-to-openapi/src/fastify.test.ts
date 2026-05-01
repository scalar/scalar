import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { fileNameResolver, program } from '../test/test-setup'
import { generateFastifyOpenApiDocument } from './fastify'

describe('generateFastifyOpenApiDocument', () => {
  const sourceFilePath = path.join(import.meta.dirname, '../test/fixtures/fastify-routes.ts')
  const sourceFile = program.getSourceFile(sourceFilePath)

  if (!sourceFile) {
    throw new Error('Fastify fixture source file was not loaded')
  }

  const document = generateFastifyOpenApiDocument(sourceFile, program, fileNameResolver, {
    title: 'Fastify Users API',
    version: '2026.05.01',
  })
  const paths = document.paths ?? {}

  it('generates document metadata', () => {
    expect(document.openapi).toBe('3.1.0')
    expect(document.info).toStrictEqual({
      title: 'Fastify Users API',
      version: '2026.05.01',
    })
  })

  it('generates validation schemas for typed shorthand route inputs', () => {
    expect(paths['/users']?.post?.requestBody).toStrictEqual({
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                minLength: 1,
              },
              email: {
                type: 'string',
                format: 'email',
              },
            },
            required: ['name', 'email'],
          },
        },
      },
    })

    expect(paths['/users']?.post?.parameters).toStrictEqual([])

    expect(paths['/typed-users']?.post?.requestBody).toStrictEqual({
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
              role: {
                type: 'string',
                enum: ['admin', 'member'],
              },
            },
          },
        },
      },
    })

    expect(paths['/typed-users']?.post?.parameters).toStrictEqual([
      {
        in: 'query',
        name: 'invite',
        required: false,
        schema: {
          type: 'boolean',
        },
      },
      {
        in: 'header',
        name: 'x-tenant',
        required: false,
        schema: {
          type: 'string',
        },
      },
    ])
  })

  it('generates status responses from Fastify Reply generics', () => {
    expect(paths['/users']?.post?.responses).toStrictEqual({
      '201': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                  format: 'email',
                },
              },
              required: ['id', 'name', 'email'],
            },
          },
        },
      },
    })

    expect(paths['/typed-users']?.post?.responses).toStrictEqual({
      '201': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'member'],
                },
              },
            },
          },
        },
      },
      '400': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    })
  })

  it('prefers Fastify schema literals over route generic inputs', () => {
    expect(paths['/users/{id}']?.get?.parameters).toStrictEqual([
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
      {
        in: 'query',
        name: 'includePosts',
        required: false,
        schema: {
          type: 'boolean',
        },
      },
    ])

    expect(paths['/users/{id}']?.get?.responses).toStrictEqual({
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
                posts: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
      '404': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'not_found',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    })
  })

  it('generates typed-only request inputs when schemas are omitted', () => {
    expect(paths['/typed-users']?.post?.requestBody).toStrictEqual({
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
              role: {
                type: 'string',
                enum: ['admin', 'member'],
              },
            },
          },
        },
      },
    })

    expect(paths['/typed-users']?.post?.parameters).toStrictEqual([
      {
        in: 'query',
        name: 'invite',
        required: false,
        schema: {
          type: 'boolean',
        },
      },
      {
        in: 'header',
        name: 'x-tenant',
        required: false,
        schema: {
          type: 'string',
        },
      },
    ])
  })

  it('generates operations from fastify.route calls', () => {
    expect(paths['/users/{id}/settings']?.patch?.requestBody).toStrictEqual({
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              enabled: {
                type: 'boolean',
              },
            },
            required: ['enabled'],
          },
        },
      },
    })

    expect(paths['/users/{id}/settings']?.patch?.responses).toStrictEqual({
      '204': {
        description: 'Settings updated',
      },
    })
  })
})
