import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanupTooltipElement, useTooltip } from '../useTooltip'
import { ELEMENT_ID } from '../constants'
import { nextTick, ref } from 'vue'

describe('useTooltip', () => {
  let targetElement: HTMLElement

  beforeEach(() => {
    // Create a target element for testing
    targetElement = document.createElement('button')
    document.body.appendChild(targetElement)

    // Mock timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Cleanup the tooltip element
    cleanupTooltipElement()
    document.body.innerHTML = ''

    // Restore the real timers
    vi.useRealTimers()
  })

  it('should initialize tooltip element on first use', async () => {
    useTooltip({
      content: 'Test tooltip',
      targetRef: targetElement,
    })

    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement).toBeTruthy()
    expect(tooltipElement?.classList.contains('scalar-tooltip')).toBe(true)
  })

  it('should show tooltip on mouseenter after delay', async () => {
    const delay = 100
    useTooltip({
      content: 'Test tooltip',
      targetRef: targetElement,
      delay,
    })

    // Trigger mouseenter
    targetElement.dispatchEvent(new MouseEvent('mouseenter'))

    // Tooltip should not be visible immediately
    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.style.display).toBe('none')

    // Fast forward past the delay
    await vi.advanceTimersByTime(delay)

    // Tooltip should now be visible
    expect(tooltipElement?.style.display).toBe('block')
    expect(tooltipElement?.textContent).toBe('Test tooltip')
  })

  it('should show tooltip immediately when delay is 0', async () => {
    useTooltip({
      content: 'Test tooltip',
      targetRef: targetElement,
      delay: 0,
    })

    // Trigger mouseenter
    targetElement.dispatchEvent(new MouseEvent('mouseenter'))

    await nextTick()

    // Tooltip should be visible immediately
    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.style.display).toBe('block')
    expect(tooltipElement?.textContent).toBe('Test tooltip')
  })

  it('should hide tooltip on mouseleave', async () => {
    useTooltip({
      content: 'Test tooltip',
      targetRef: targetElement,
    })

    // Show tooltip
    targetElement.dispatchEvent(new MouseEvent('mouseenter'))
    vi.runAllTimers()

    // Hide tooltip
    targetElement.dispatchEvent(new MouseEvent('mouseleave'))

    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.style.display).toBe('none')
  })

  it('should hide tooltip on escape key', async () => {
    useTooltip({
      content: 'Test tooltip',
      targetRef: targetElement,
    })

    // Show tooltip
    targetElement.dispatchEvent(new MouseEvent('mouseenter'))
    vi.runAllTimers()

    const tooltipElement = document.getElementById(ELEMENT_ID)

    await nextTick()

    expect(tooltipElement?.style.display).toBe('block')

    // Press escape
    targetElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    await nextTick()

    expect(tooltipElement?.style.display).toBe('none')
  })

  it('should update tooltip content when content changes', async () => {
    const content = ref('Initial content')
    useTooltip({
      content,
      targetRef: targetElement,
    })

    // Show tooltip
    targetElement.dispatchEvent(new MouseEvent('mouseenter'))

    vi.runAllTimers()

    await nextTick()

    expect(document.getElementById(ELEMENT_ID)?.textContent).toBe('Initial content')

    // Update content
    content.value = 'Updated content'

    await nextTick()

    expect(document.getElementById(ELEMENT_ID)?.textContent).toBe('Updated content')
  })

  it('should set aria-describedby on target element', async () => {
    useTooltip({
      content: 'Test tooltip',
      targetRef: targetElement,
    })

    expect(targetElement.getAttribute('aria-describedby')).toBe(ELEMENT_ID)
  })

  it('should clean up attributes when target changes', async () => {
    const newTarget = document.createElement('button')
    document.body.appendChild(newTarget)

    const targetRef = ref(targetElement)
    useTooltip({
      content: 'Test tooltip',
      targetRef,
    })

    // Initial target should have aria-describedby
    expect(targetElement.getAttribute('aria-describedby')).toBe(ELEMENT_ID)

    // Change target
    targetRef.value = newTarget

    await nextTick()

    // Initial target should not have aria-describedby
    expect(targetElement.getAttribute('aria-describedby')).toBeNull()

    // New target should have aria-describedby
    expect(newTarget.getAttribute('aria-describedby')).toBe(ELEMENT_ID)
  })
})
