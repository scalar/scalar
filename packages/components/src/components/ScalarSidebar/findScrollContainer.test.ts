import { describe, it, expect, beforeEach } from 'vitest'
import { findScrollContainer } from './findScrollContainer'

describe('findScrollContainer', () => {
  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = ''
  })

  it('returns document.documentElement when no scrollable parent is found', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)

    const result = findScrollContainer(element)
    expect(result).toBe(document.documentElement)
  })

  it('finds a scrollable parent with overflow: auto', () => {
    const scrollableParent = document.createElement('div')
    scrollableParent.style.overflow = 'auto'

    const child = document.createElement('div')
    scrollableParent.appendChild(child)
    document.body.appendChild(scrollableParent)

    const result = findScrollContainer(child)
    expect(result).toBe(scrollableParent)
  })

  it('finds a scrollable parent with overflow: scroll', () => {
    const scrollableParent = document.createElement('div')
    scrollableParent.style.overflow = 'scroll'

    const child = document.createElement('div')
    scrollableParent.appendChild(child)
    document.body.appendChild(scrollableParent)

    const result = findScrollContainer(child)
    expect(result).toBe(scrollableParent)
  })

  it('finds the nearest scrollable parent, not a further ancestor', () => {
    const outerScrollable = document.createElement('div')
    outerScrollable.style.overflow = 'auto'

    const innerScrollable = document.createElement('div')
    innerScrollable.style.overflow = 'scroll'

    const child = document.createElement('div')

    outerScrollable.appendChild(innerScrollable)
    innerScrollable.appendChild(child)
    document.body.appendChild(outerScrollable)

    const result = findScrollContainer(child)
    expect(result).toBe(innerScrollable)
  })

  it('skips non-scrollable parents', () => {
    const nonScrollable = document.createElement('div')
    nonScrollable.style.overflow = 'visible'

    const scrollableParent = document.createElement('div')
    scrollableParent.style.overflow = 'auto'

    const child = document.createElement('div')

    scrollableParent.appendChild(nonScrollable)
    nonScrollable.appendChild(child)
    document.body.appendChild(scrollableParent)

    const result = findScrollContainer(child)
    expect(result).toBe(scrollableParent)
  })

  describe('direction handling', () => {
    it('finds scrollable parent in y direction by default', () => {
      const scrollableParent = document.createElement('div')
      scrollableParent.style.overflowY = 'auto'
      scrollableParent.style.overflowX = 'visible'

      const child = document.createElement('div')
      scrollableParent.appendChild(child)
      document.body.appendChild(scrollableParent)

      const result = findScrollContainer(child)
      expect(result).toBe(scrollableParent)
    })

    it('finds scrollable parent in x direction when specified', () => {
      const scrollableParent = document.createElement('div')
      scrollableParent.style.overflowX = 'auto'
      scrollableParent.style.overflowY = 'visible'

      const child = document.createElement('div')
      scrollableParent.appendChild(child)
      document.body.appendChild(scrollableParent)

      const result = findScrollContainer(child, 'x')
      expect(result).toBe(scrollableParent)
    })

    it('ignores x scrollable parent when looking for y direction', () => {
      const scrollableParent = document.createElement('div')
      scrollableParent.style.overflowX = 'auto'
      scrollableParent.style.overflowY = 'visible'

      const child = document.createElement('div')
      scrollableParent.appendChild(child)
      document.body.appendChild(scrollableParent)

      const result = findScrollContainer(child, 'y')
      expect(result).toBe(document.documentElement)
    })

    it('ignores y scrollable parent when looking for x direction', () => {
      const scrollableParent = document.createElement('div')
      scrollableParent.style.overflowY = 'auto'
      scrollableParent.style.overflowX = 'visible'

      const child = document.createElement('div')
      scrollableParent.appendChild(child)
      document.body.appendChild(scrollableParent)

      const result = findScrollContainer(child, 'x')
      expect(result).toBe(document.documentElement)
    })
  })

  describe('overflow shorthand handling', () => {
    it('handles overflow shorthand with two values', () => {
      const scrollableParent = document.createElement('div')
      scrollableParent.style.overflow = 'auto scroll'

      const child = document.createElement('div')
      scrollableParent.appendChild(child)
      document.body.appendChild(scrollableParent)

      // First value is x, second is y
      expect(findScrollContainer(child, 'x')).toBe(scrollableParent)
      expect(findScrollContainer(child, 'y')).toBe(scrollableParent)
    })

    it('handles overflow shorthand with single value', () => {
      const scrollableParent = document.createElement('div')
      scrollableParent.style.overflow = 'auto'

      const child = document.createElement('div')
      scrollableParent.appendChild(child)
      document.body.appendChild(scrollableParent)

      // Single value applies to both directions
      expect(findScrollContainer(child, 'x')).toBe(scrollableParent)
      expect(findScrollContainer(child, 'y')).toBe(scrollableParent)
    })

    it('handles mixed overflow values', () => {
      const scrollableParent = document.createElement('div')
      scrollableParent.style.overflow = 'scroll visible'

      const child = document.createElement('div')
      scrollableParent.appendChild(child)
      document.body.appendChild(scrollableParent)

      // x is scroll, y is visible
      expect(findScrollContainer(child, 'x')).toBe(scrollableParent)
      expect(findScrollContainer(child, 'y')).toBe(document.documentElement)
    })
  })

  describe('edge cases', () => {
    it('handles element with no parent', () => {
      const element = document.createElement('div')
      // Don't append to DOM, so it has no parent

      const result = findScrollContainer(element)
      expect(result).toBe(document.documentElement)
    })

    it('handles deeply nested elements', () => {
      const scrollableParent = document.createElement('div')
      scrollableParent.style.overflow = 'auto'

      // Create a deep nesting
      let current = scrollableParent
      for (let i = 0; i < 10; i++) {
        const div = document.createElement('div')
        current.appendChild(div)
        current = div
      }

      document.body.appendChild(scrollableParent)

      const result = findScrollContainer(current)
      expect(result).toBe(scrollableParent)
    })

    it('handles elements with hidden overflow', () => {
      const hiddenParent = document.createElement('div')
      hiddenParent.style.overflow = 'hidden'

      const child = document.createElement('div')
      hiddenParent.appendChild(child)
      document.body.appendChild(hiddenParent)

      const result = findScrollContainer(child)
      expect(result).toBe(document.documentElement)
    })
  })
})
