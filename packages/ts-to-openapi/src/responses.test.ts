import {
  type ReturnStatement,
  SyntaxKind,
  isArrowFunction,
  isCallExpression,
  isTypeAliasDeclaration,
  isTypeAssertionExpression,
  isVariableDeclaration,
  isVariableStatement,
} from 'typescript'
import { describe, expect, it } from 'vitest'

import { generateResponses, getReturnStatements } from './responses'
import { fileResolver, program } from './test-setup'
import { getSchemaFromTypeNode } from './type-nodes'

const sourceFile = program.getSourceFile('src/fixtures/returns.ts')

// First we get to the body
const getNode = sourceFile?.statements[0]
if (!getNode || !isVariableStatement(getNode)) throw 'Not a variable statement'

const initializer = getNode.declarationList.declarations[0].initializer
if (!initializer || !isArrowFunction(initializer)) throw 'Not an arrow function'

describe('getReturnStatements', () => {
  const generator = getReturnStatements(initializer.body)

  it('should get a return statement with two arguments', () => {
    const statement = generator.next().value as ReturnStatement
    expect(statement.kind).toEqual(SyntaxKind.ReturnStatement)

    if (!statement.expression || !isCallExpression(statement.expression)) return
    expect(statement.expression.arguments.length).toEqual(2)
  })

  it('should get another return statement', () =>
    expect(generator.next().value.kind).toEqual(SyntaxKind.ReturnStatement))
  it('should get yet another return statement', () =>
    expect(generator.next().value.kind).toEqual(SyntaxKind.ReturnStatement))
})

describe('createResponseSchemas', () => {
  const responses = generateResponses(initializer.body, program, fileResolver)
  console.log(responses)
})
