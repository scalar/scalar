import { ScriptTarget, createSourceFile } from 'typescript'
import { describe, expect, it } from 'vitest'

import { getJSDocFromNode } from './js-doc'

describe('js-doc', () => {
  it.each(['', '/** */', '// An ordinary comment'])('handles absent or empty documentation: %s', (comment) => {
    const source = createSourceFile('route.ts', `${comment}\nexport function GET() {}`, ScriptTarget.Latest, true)

    expect(getJSDocFromNode(source.statements[0]!)).toStrictEqual({
      title: 'use to set the summary',
      description: 'use jsdoc tag to set the description',
    })
  })

  it('extracts a summary and multiline description', () => {
    const source = createSourceFile(
      'route.ts',
      '/** List users\n * Returns active users.\n * Includes their names.\n */\nexport function GET() {}',
      ScriptTarget.Latest,
      true,
    )

    expect(getJSDocFromNode(source.statements[0]!)).toStrictEqual({
      title: 'List users',
      description: 'Returns active users.\nIncludes their names.',
    })
  })

  it('lets explicit tags override the prose', () => {
    const source = createSourceFile(
      'route.ts',
      '/** Original title\n * Original description\n * @summary List users\n * @description Returns users.\n */\nexport function GET() {}',
      ScriptTarget.Latest,
      true,
    )

    expect(getJSDocFromNode(source.statements[0]!)).toStrictEqual({
      title: 'List users',
      description: 'Returns users.',
    })
  })

  it('preserves the first documentation block when several are attached', () => {
    const source = createSourceFile(
      'route.ts',
      '/** First title\n * First description\n */\n/** Second title */\nexport function GET() {}',
      ScriptTarget.Latest,
      true,
    )

    expect(getJSDocFromNode(source.statements[0]!)).toStrictEqual({
      title: 'First title',
      description: 'First description',
    })
  })
})
