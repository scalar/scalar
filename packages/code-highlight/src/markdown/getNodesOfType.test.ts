import { describe, expect, it } from 'vitest'

import { getMarkdownAst, getNodesOfType } from './markdown'

describe('getNodesOfType', () => {
  it('gets a heading', () => {
    const markdown = `# Example Heading`

    const ast = getMarkdownAst(markdown)
    const headings = getNodesOfType(ast, 'heading')

    expect(headings).toEqual([{ depth: 1, value: 'Example Heading' }])
  })

  it('gets nested headings', () => {
    const markdown = `
# Example Heading

## Nested Heading
`

    const ast = getMarkdownAst(markdown)
    const headings = getNodesOfType(ast, 'heading')

    expect(headings).toEqual([
      { depth: 1, value: 'Example Heading' },
      { depth: 2, value: 'Nested Heading' },
    ])
  })

  it('ignores Markdown in code blocks', () => {
    const markdown = `
# Example Heading

    ## Not a heading

## Nested Heading

\`\`\`
## Not a heading
\`\`\`
`

    const ast = getMarkdownAst(markdown)
    const headings = getNodesOfType(ast, 'heading')

    expect(headings).toEqual([
      { depth: 1, value: 'Example Heading' },
      { depth: 2, value: 'Nested Heading' },
    ])
  })
})
