import { describe, expect, test } from 'vitest'

import { getHeadingsFromMarkdown } from './getHeadingsFromMarkdown'

const mdString = `
# Level 1 heading

## Level 1a heading

## Some 1b heading

### Level 3 heading

# Another l1 heading
###### Some l6 heading


`
describe('Gets all headings from a markdown string', () => {
  test('Handles basic headings', () => {
    expect(getHeadingsFromMarkdown(mdString)).toEqual([
      { depth: 1, value: 'Level 1 heading', slug: 'level-1-heading' },
      { depth: 2, value: 'Level 1a heading', slug: 'level-1a-heading' },
      { depth: 2, value: 'Some 1b heading', slug: 'some-1b-heading' },
      { depth: 3, value: 'Level 3 heading', slug: 'level-3-heading' },
      { depth: 1, value: 'Another l1 heading', slug: 'another-l1-heading' },
      { depth: 6, value: 'Some l6 heading', slug: 'some-l6-heading' },
    ])
  })
})
