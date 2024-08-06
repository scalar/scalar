import { describe, expect, it } from 'vitest'

import { getMarkdownAst, splitContent } from './markdown'

describe('splitContent', () => {
  it('returns a single document if there’s no heading', () => {
    const ast = getMarkdownAst(`Foobar`)

    const sections = splitContent(ast)

    expect(sections).toMatchObject(['Foobar'])
  })

  it('splits the markdown document', () => {
    const ast = getMarkdownAst(`# Example Heading

Foobar`)

    const sections = splitContent(ast)

    expect(sections).toMatchObject(['# Example Heading', 'Foobar'])
  })

  it('splits multiple headings', () => {
    const ast = getMarkdownAst(`# Example Heading

## Other Heading

Foobar`)

    const sections = splitContent(ast)

    expect(sections).toMatchObject([
      '# Example Heading',
      '## Other Heading',
      'Foobar',
    ])
  })
})
