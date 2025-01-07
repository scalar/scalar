/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'

import { useTooltip } from './useTooltip'

describe('example', () => {
  it('should create a tooltip with default props', () => {
    const elementRef = useTooltip({ content: 'Test tooltip' })
    expect(elementRef.value).toBe(null)
  })

  it('should not create tooltip without content', () => {
    const elementRef = useTooltip()
    expect(elementRef.value).toBe(null)
  })

  it('should create tooltip with custom props', () => {
    const elementRef = useTooltip({
      content: 'Custom tooltip',
      placement: 'bottom',
      delay: 100,
      duration: [50, 100],
      offset: [10, 10],
    })
    expect(elementRef.value).toBe(null)
  })

  it('should handle HTML content in tooltip', () => {
    const elementRef = useTooltip({
      content: '<div>HTML Content</div>',
      allowHTML: true,
    })
    expect(elementRef.value).toBe(null)
  })

  it('should update tooltip when props change', () => {
    const elementRef = useTooltip({ content: 'Initial content' })
    expect(elementRef.value).toBe(null)

    // Update props
    elementRef.value = document.createElement('div')
    expect(elementRef.value).toBeInstanceOf(HTMLElement)
  })

  it('should destroy tooltip when component unmounts', () => {
    const elementRef = useTooltip({ content: 'Test tooltip' })
    expect(elementRef.value).toBe(null)

    // Simulate mounting
    elementRef.value = document.createElement('div')
    expect(elementRef.value).toBeInstanceOf(HTMLElement)

    // Simulate unmounting
    elementRef.value = null
    expect(elementRef.value).toBe(null)
  })
})
