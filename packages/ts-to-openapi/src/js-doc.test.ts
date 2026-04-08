import path from 'node:path'

import { isTypeAliasDeclaration } from 'typescript'
import { describe, expect, it } from 'vitest'

import { program } from '../test/test-setup'
import { getJSDocFromNode } from './js-doc'

const testingTypesPath = path.join(import.meta.dirname, '../test/fixtures/testing-types.ts')

describe('js-doc', () => {
  it('uses final summary and description tags when present', () => {
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

  it('uses comment lines for title and description', () => {
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

  it('returns defaults when node has no jsdoc', () => {
    const sourceFile = program.getSourceFile(testingTypesPath)
    const numVariable = sourceFile?.statements[1]

    if (!numVariable) {
      throw new Error('num variable statement was not found in testing types fixture')
    }

    const result = getJSDocFromNode(numVariable)
    expect(result).toStrictEqual({
      title: 'use to set the summary',
      description: 'use jsdoc tag to set the description',
    })
  })
})
