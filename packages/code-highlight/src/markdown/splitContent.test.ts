import { describe, expect, it } from 'vitest'

import { splitContent } from './markdown'

describe('splitContent', () => {
  it("returns a single document if there's no heading", () => {
    const sections = splitContent('Foobar')

    expect(sections).toMatchObject(['Foobar'])
  })

  it('splits the markdown document', () => {
    const sections = splitContent('# Example Heading\n\nFoobar')

    expect(sections).toMatchObject(['# Example Heading', 'Foobar'])
  })

  it('splits multiple headings', () => {
    const sections = splitContent('# Example Heading\n\n## Other Heading\n\nFoobar')

    expect(sections).toMatchObject(['# Example Heading', '## Other Heading', 'Foobar'])
  })
})
