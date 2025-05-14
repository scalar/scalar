import { describe, expect, it } from 'vitest'

import { getHeadingsFromMarkdown } from './markdown'

describe('markdown', () => {
  describe('getHeadingsFromMarkdown', () => {
    it('get headings from Markdown', () => {
      const markdown = `
# Level 1 heading

## Level 1a heading

## Some 1b heading

### Level 3 heading

# Another l1 heading
###### Some l6 heading
`

      expect(getHeadingsFromMarkdown(markdown)).toMatchObject([
        { depth: 1, value: 'Level 1 heading' },
        { depth: 2, value: 'Level 1a heading' },
        { depth: 2, value: 'Some 1b heading' },
        { depth: 3, value: 'Level 3 heading' },
        { depth: 1, value: 'Another l1 heading' },
        { depth: 6, value: 'Some l6 heading' },
      ])
    })

    it('ignores Markdown in code blocks', () => {
      const markdown = `
# Heading

\`\`\`
## Not a heading
\`\`\`
`

      expect(getHeadingsFromMarkdown(markdown)).toMatchObject([{ depth: 1, value: 'Heading' }])
    })

    it('has slugs', () => {
      const markdown = `
# Hello World

## Hello World
`

      expect(getHeadingsFromMarkdown(markdown)).toMatchObject([{ slug: 'hello-world' }, { slug: 'hello-world-1' }])
    })
  })
})
