import { describe, expect, it } from 'vitest'

import { traverseDescription } from './traverse-description'

describe('traverseDescription', () => {
  const getHeadingId = (heading: { value: string }) => `heading-${heading.value.toLowerCase().replace(/\s+/g, '-')}`

  it('should return empty array for undefined description', () => {
    const titlesMap = new Map<string, string>()
    const result = traverseDescription(undefined, titlesMap, getHeadingId)
    expect(result).toEqual([])
    expect(titlesMap.size).toBe(0)
  })

  it('should return empty array for empty description', () => {
    const titlesMap = new Map<string, string>()
    const result = traverseDescription('', titlesMap, getHeadingId)
    expect(result).toEqual([])
    expect(titlesMap.size).toBe(0)
  })

  it('should return an introduction entry for description with no headings', () => {
    const titlesMap = new Map<string, string>()
    const description = 'This is a paragraph without any headings.'
    const result = traverseDescription(description, titlesMap, getHeadingId)
    expect(result).toEqual([{ id: 'heading-introduction', title: 'Introduction', type: 'text' }])
    expect(titlesMap.size).toBe(1)
  })

  it('should create single level entries for h1 headings', () => {
    const titlesMap = new Map<string, string>()
    const description = `
# First Heading
Some content here
# Second Heading
More content
# Third Heading
Final content
    `
    const result = traverseDescription(description, titlesMap, getHeadingId)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      id: 'heading-first-heading',
      title: 'First Heading',
      children: [],
      type: 'text',
    })
    expect(result[1]).toEqual({
      id: 'heading-second-heading',
      title: 'Second Heading',
      children: [],
      type: 'text',
    })
    expect(result[2]).toEqual({
      id: 'heading-third-heading',
      title: 'Third Heading',
      children: [],
      type: 'text',
    })
    expect(titlesMap.size).toBe(3)
    expect(titlesMap.get('heading-first-heading')).toBe('First Heading')
  })

  it('should create nested entries for h1 and h2 headings', () => {
    const titlesMap = new Map<string, string>()
    const description = `
# Main Section
Some content
## Subsection 1
Content for subsection 1
## Subsection 2
Content for subsection 2
# Another Section
More content
## Another Subsection
Final content
    `
    const result = traverseDescription(description, titlesMap, getHeadingId)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'heading-main-section',
      title: 'Main Section',
      type: 'text',
      children: [
        {
          id: 'heading-subsection-1',
          title: 'Subsection 1',
          type: 'text',
        },
        {
          id: 'heading-subsection-2',
          title: 'Subsection 2',
          type: 'text',
        },
      ],
    })
    expect(result[1]).toEqual({
      id: 'heading-another-section',
      title: 'Another Section',
      type: 'text',
      children: [
        {
          id: 'heading-another-subsection',
          title: 'Another Subsection',
          type: 'text',
        },
      ],
    })
    expect(titlesMap.size).toBe(5)
  })

  it('should handle h2 and h3 headings when they are the lowest levels', () => {
    const titlesMap = new Map<string, string>()
    const description = `
## Section 1
Content
### Subsection 1.1
Content
### Subsection 1.2
Content
## Section 2
Content
### Subsection 2.1
Content
    `
    const result = traverseDescription(description, titlesMap, getHeadingId)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'heading-section-1',
      title: 'Section 1',
      type: 'text',
      children: [
        {
          id: 'heading-subsection-1.1',
          title: 'Subsection 1.1',
          type: 'text',
        },
        {
          id: 'heading-subsection-1.2',
          title: 'Subsection 1.2',
          type: 'text',
        },
      ],
    })
    expect(result[1]).toEqual({
      id: 'heading-section-2',
      title: 'Section 2',
      type: 'text',
      children: [
        {
          id: 'heading-subsection-2.1',
          title: 'Subsection 2.1',
          type: 'text',
        },
      ],
    })
    expect(titlesMap.size).toBe(5)
  })

  it('should skip headings that are not at the lowest two levels', () => {
    const titlesMap = new Map<string, string>()
    const description = `
# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
    `
    const result = traverseDescription(description, titlesMap, getHeadingId)

    // Should only include Level 1 and Level 2
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'heading-level-1',
      title: 'Level 1',
      type: 'text',
      children: [
        {
          id: 'heading-level-2',
          title: 'Level 2',
          type: 'text',
        },
      ],
    })
    expect(titlesMap.size).toBe(2)
  })

  it('should handle special characters in headings', () => {
    const titlesMap = new Map<string, string>()
    const description = `
# Section with @#$%^&*() chars
## Sub-section with !@#$%^&*() chars
    `
    const result = traverseDescription(description, titlesMap, getHeadingId)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'heading-section-with-@#$%^&*()-chars',
      title: 'Section with @#$%^&*() chars',
      children: [
        {
          id: 'heading-sub-section-with-!@#$%^&*()-chars',
          title: 'Sub-section with !@#$%^&*() chars',
          type: 'text',
        },
      ],
      type: 'text',
    })
    expect(titlesMap.size).toBe(2)
  })
})
