import { describe, expect, it } from 'vitest'

import { splitMarkdownInSections } from './splitMarkdownInSections'

describe('splitMarkdownInSections', () => {
  it('splits markdown in sections', async () => {
    testSections(`# Foobar`, 1)

    testSections(
      `
# Foobar
# Barfoo
    `,
      2,
    )

    testSections(
      `
# Foobar
## Foobar
# Barfoo
      `,
      2,
    )

    testSections(
      `
# Foobar
## Foobar
# Barfoo
        `,
      2,
      2,
    )
  })
})

function testSections(
  content: string,
  length: number,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 1,
) {
  const sections = splitMarkdownInSections(content, level)
  console.log(sections)
  expect(sections.length).toBe(length)
}
