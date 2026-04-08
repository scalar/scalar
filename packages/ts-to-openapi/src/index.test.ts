import path from 'node:path'

import {
  type FunctionDeclaration,
  type SourceFile,
  type VariableStatement,
  isFunctionDeclaration,
  isIdentifier,
  isVariableStatement,
} from 'typescript'
import { describe, expect, it } from 'vitest'

import { fileNameResolver, program } from '../test/test-setup'
import {
  defaultFileNameResolver,
  extractPathParameters,
  getHttpMethodFromIdentifier,
  getPathOperations,
} from './index'

const routeFixturePath = path.join(import.meta.dirname, '../test/fixtures/route-fixture.ts')
const routeFixtureSourceFile = program.getSourceFile(routeFixturePath)

const getRouteFixtureSourceFile = (): SourceFile => {
  if (!routeFixtureSourceFile) {
    throw new Error('route-fixture source file was not loaded in the TypeScript program')
  }

  return routeFixtureSourceFile
}

describe('index', () => {
  it('resolves relative import path using source extension', () => {
    const resolved = defaultFileNameResolver('/workspace/test/foo/route.ts', './shared-types')
    expect(resolved).toBe('/workspace/test/foo/shared-types.ts')
  })

  it('keeps explicit extension when resolving import path', () => {
    const resolved = defaultFileNameResolver('/workspace/test/foo/route.ts', '../types.ts')
    expect(resolved).toBe('/workspace/test/types.ts')
  })

  it('maps HTTP method from upper-cased identifier', () => {
    const sourceFile = getRouteFixtureSourceFile()
    const patchStatement = sourceFile.statements.find((statement): statement is VariableStatement => {
      if (!isVariableStatement(statement)) {
        return false
      }

      const declaration = statement.declarationList.declarations[0]
      return declaration !== undefined && isIdentifier(declaration.name) && declaration.name.escapedText === 'PATCH'
    })

    if (!patchStatement) {
      throw new Error('PATCH variable statement was not found in route fixture source file')
    }

    const patchDeclaration = patchStatement.declarationList.declarations[0]
    const method = patchDeclaration && isIdentifier(patchDeclaration.name) ? getHttpMethodFromIdentifier(patchDeclaration.name) : null
    expect(method).toBe('patch')
  })

  it('returns null for unsupported method identifier', () => {
    const sourceFile = getRouteFixtureSourceFile()
    const traceDeclaration = sourceFile.statements.find((statement): statement is FunctionDeclaration => {
      return isFunctionDeclaration(statement) && statement.name?.escapedText === 'TRACE'
    })

    if (!traceDeclaration?.name) {
      throw new Error('TRACE function declaration was not found in route fixture source file')
    }

    const method = getHttpMethodFromIdentifier(traceDeclaration.name)
    expect(method).toBeNull()
  })

  it('extracts route path parameters from second function argument', () => {
    const sourceFile = getRouteFixtureSourceFile()
    const getDeclaration = sourceFile.statements.find((statement): statement is FunctionDeclaration => {
      return isFunctionDeclaration(statement) && statement.name?.escapedText === 'GET'
    })

    if (!getDeclaration) {
      throw new Error('GET function declaration was not found in fixture source file')
    }

    const parameters = extractPathParameters(getDeclaration.parameters[1], program, fileNameResolver)
    expect(parameters).toStrictEqual([
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'version',
        in: 'path',
        required: true,
        schema: {
          type: 'number',
        },
      },
      {
        name: 'mode',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          example: 'This type may be external',
        },
      },
    ])
  })

  it('returns no path parameters when handler params argument is missing', () => {
    const sourceFile = getRouteFixtureSourceFile()
    const getDeclaration = sourceFile.statements.find((statement): statement is FunctionDeclaration => {
      return isFunctionDeclaration(statement) && statement.name?.escapedText === 'GET'
    })

    if (!getDeclaration) {
      throw new Error('GET function declaration was not found in fixture source file')
    }

    const parameters = extractPathParameters(getDeclaration.parameters[0], program, fileNameResolver)
    expect(parameters).toStrictEqual([])
  })

  it('generates OpenAPI operations for route handlers with jsdoc and responses', () => {
    const sourceFile = getRouteFixtureSourceFile()
    const paths = getPathOperations(sourceFile, program, fileNameResolver)

    expect(paths).toStrictEqual({
      get: {
        summary: 'Get user details',
        description: 'Returns API description from tags',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'version',
            in: 'path',
            required: true,
            schema: {
              type: 'number',
            },
          },
          {
            name: 'mode',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              example: 'This type may be external',
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
                    userId: {
                      type: 'null',
                      description: 'TODO: This is an unknown type',
                    },
                    version: {
                      type: 'null',
                      description: 'TODO: This is an unknown type',
                    },
                    mode: {
                      type: 'null',
                      description: 'TODO: This is an unknown type',
                    },
                  },
                },
              },
            },
          },
          '403': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'forbidden',
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create user',
        description: 'This endpoint creates records.',
        responses: {
          '201': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    created: {
                      type: 'boolean',
                      example: true,
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    created: {
                      type: 'boolean',
                      example: false,
                    },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'use to set the summary',
        description: 'use jsdoc tag to set the description',
        responses: {
          '204': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    updated: {
                      type: 'boolean',
                      example: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        summary: 'use to set the summary',
        description: 'use jsdoc tag to set the description',
        responses: {
          '202': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                  example: 'patched',
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'use to set the summary',
        description: 'use jsdoc tag to set the description',
        parameters: [],
        responses: {
          '200': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                  example: 'deleted',
                },
              },
            },
          },
        },
      },
    })
  })

  it('ignores variable statements that are not HTTP methods', () => {
    const sourceFile = getRouteFixtureSourceFile()
    const operations = getPathOperations(sourceFile, program, fileNameResolver)
    expect(operations.helper).toBeUndefined()
  })
})
