import path from 'node:path'

import { isIdentifier, isTypeAliasDeclaration, isVariableStatement } from 'typescript'
import { describe, expect, it } from 'vitest'

import { program } from '../test/test-setup'
import { getJSDocFromNode } from './js-doc'

const testingTypesPath = path.join(import.meta.dirname, '../test/fixtures/testing-types.ts')
const routeFixturePath = path.join(import.meta.dirname, '../test/fixtures/route-fixture.ts')

describe('js-doc', () => {
  it('uses summary and description tags when present', () => {
    const sourceFile = program.getSourceFile(routeFixturePath)
    const getHandler = sourceFile?.statements[1]

    if (!getHandler) {
      throw new Error('GET handler statement was not found in route fixture source file')
    }

    const result = getJSDocFromNode(getHandler)
    expect(result).toStrictEqual({
      title: 'Get user details',
      description: 'Returns API description from tags',
    })
  })

  it('uses comment lines when summary and description tags are missing', () => {
    const sourceFile = program.getSourceFile(routeFixturePath)
    const postHandler = sourceFile?.statements[2]

    if (!postHandler) {
      throw new Error('POST handler statement was not found in route fixture source file')
    }

    const result = getJSDocFromNode(postHandler)
    expect(result).toStrictEqual({
      title: 'Create user',
      description: 'This endpoint creates records.',
    })
  })

  it('returns defaults when node has no jsdoc', () => {
    const sourceFile = program.getSourceFile(routeFixturePath)
    const putHandler = sourceFile?.statements.find((statement) => {
      if (!isVariableStatement(statement)) {
        return false
      }

      const declaration = statement.declarationList.declarations[0]
      return declaration && isIdentifier(declaration.name) && declaration.name.escapedText === 'PUT'
    })

    if (!putHandler) {
      throw new Error('PUT handler statement was not found in route fixture source file')
    }

    const result = getJSDocFromNode(putHandler)
    expect(result).toStrictEqual({
      title: 'use to set the summary',
      description: 'use jsdoc tag to set the description',
    })
  })

  it('uses the final summary-like tag value when multiple tags exist', () => {
    const sourceFile = program.getSourceFile(testingTypesPath)
    const superDataType = sourceFile?.statements.find(isTypeAliasDeclaration)

    if (!superDataType) {
      throw new Error('SuperDataType type alias was not found in testing types fixture')
    }

    const result = getJSDocFromNode(superDataType)
    expect(result).toStrictEqual({
      title: 'To summarize or not to summarize',
      description: 'You will be absolutely blown away by this schema',
    })
  })
})
