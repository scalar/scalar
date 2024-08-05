import { describe, expect, it } from 'vitest'

import { getMarkdownAst, splitContent } from './markdown'

describe('splitContent', () => {
  it('returns HTML', () => {
    const ast = getMarkdownAst(`# Example Heading

Foobar`)

    const sections = splitContent(ast)

    expect(sections).toMatchObject(['# Example Heading', 'Foobar'])
  })

  it('returns HTML', () => {
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
