import { describe, expect, it } from 'vitest'

import { getHeadings } from './markdown'

describe('getHeadings', () => {
  it('gets a heading', () => {
    const markdown = '# Example Heading'

    const headings = getHeadings(markdown)

    expect(headings).toStrictEqual([{ depth: 1, value: 'Example Heading' }])
  })

  it('gets nested headings', () => {
    const markdown = `
# Example Heading

## Nested Heading
`

    const headings = getHeadings(markdown)

    expect(headings).toStrictEqual([
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

    const headings = getHeadings(markdown)

    expect(headings).toStrictEqual([
      { depth: 1, value: 'Example Heading' },
      { depth: 2, value: 'Nested Heading' },
    ])
  })

  it('works with links in headings', () => {
    const markdown = '# [Example Heading](#example-heading)'

    const headings = getHeadings(markdown)

    expect(headings).toStrictEqual([{ depth: 1, value: 'Example Heading' }])
  })
})
