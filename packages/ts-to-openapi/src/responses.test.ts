// @ts-nocheck
// TODO remove this when we come back to this file
import { type ReturnStatement, SyntaxKind, isArrowFunction, isCallExpression, isVariableStatement } from 'typescript'
import { describe, expect, it } from 'vitest'

import { generateResponses, getReturnStatements } from './responses'
import { program } from './test-setup'

const sourceFile = program.getSourceFile(__dirname + '/fixtures/test-responses.ts')

// First we get to the body
const getNode = sourceFile?.statements[0]
if (!getNode || !isVariableStatement(getNode)) {
  throw 'Not a variable statement'
}

const initializer = getNode.declarationList.declarations[0].initializer
if (!initializer || !isArrowFunction(initializer)) {
  throw 'Not an arrow function'
}

// Test return statements
describe('getReturnStatements', () => {
  const generator = getReturnStatements(initializer.body)

  it('should get a return statement with two arguments', () => {
    const statement = generator.next().value as ReturnStatement
    expect(statement.kind).toEqual(SyntaxKind.ReturnStatement)

    if (!statement.expression || !isCallExpression(statement.expression)) {
      return
    }
    expect(statement.expression.arguments.length).toEqual(2)
  })
  it('should get another return statement', () =>
    expect(generator.next().value.kind).toEqual(SyntaxKind.ReturnStatement))
  it('should get yet another return statement', () =>
    expect(generator.next().value.kind).toEqual(SyntaxKind.ReturnStatement))
})

// Test response objects
describe('createResponseSchemas', () => {
  const responses = generateResponses(initializer.body, program.getTypeChecker())

  it('should return a 200 status with string payload', () =>
    expect(responses['200']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'string',
            example: 'this is the response',
          },
        },
      },
    }))

  it('should return a 417 status with an object', () =>
    expect(responses['417']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  codez: {
                    type: 'number',
                    example: 34,
                  },
                  undef: {
                    type: 'string',
                    description: 'This value was undefined',
                  },
                  nuller: {
                    type: 'null',
                    example: null,
                  },
                  message: {
                    type: 'string',
                    example: 'This is a horrendous error',
                  },
                  things: {
                    type: 'array',
                    example: ['stuff', 'others'],
                    items: {
                      type: 'string',
                      example: 'stuff',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }))

  it('should return a 422 status with an undefined', () =>
    expect(responses['422']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'string',
            description: 'This value was undefined',
          },
        },
      },
    }))

  it('should return a 424 status with an BigInt var', () =>
    expect(responses['424']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'integer',
            example: '6515n',
          },
        },
      },
    }))

  it('should return a 425 status with an BigInt literal', () =>
    expect(responses['425']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'integer',
            example: '415645615618950n',
          },
        },
      },
    }))

  it('should return a 450 status with a number', () =>
    expect(responses['450']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'number',
            example: 123,
          },
        },
      },
    }))

  it('should return a 500 status with an array', () =>
    expect(responses['500']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            example: [123, 232, 231],
            items: {
              type: 'number',
              example: 123,
            },
          },
        },
      },
    }))

  it('should return a 501 status with a string', () =>
    expect(responses['501']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'string',
            example: 'here i am',
          },
        },
      },
    }))

  it('should return a 502 status with a boolean', () =>
    expect(responses['502']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'boolean',
            example: true,
          },
        },
      },
    }))

  it('should return a 509 status with a negative num', () =>
    expect(responses['509']).toEqual({
      description: 'TODO: grab this from jsdoc and add a default',
      content: {
        'application/json': {
          schema: {
            type: 'number',
            example: -4506.5,
          },
        },
      },
    }))
})
