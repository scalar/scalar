import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanupTooltipElement, useTooltip } from './useTooltip'
import { ELEMENT_ID } from './constants'
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

  it('should show tooltip on focus immediately', async () => {
    useTooltip({
      content: 'Test tooltip',
      targetRef: targetElement,
    })

    // Trigger focus
    targetElement.dispatchEvent(new FocusEvent('focus'))

    await nextTick()

    // Tooltip should be visible immediately (no delay for focus)
    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.style.display).toBe('block')
    expect(tooltipElement?.textContent).toBe('Test tooltip')
  })

  it('should hide tooltip on blur', async () => {
    useTooltip({
      content: 'Test tooltip',
      targetRef: targetElement,
    })

    // Show tooltip via focus
    targetElement.dispatchEvent(new FocusEvent('focus'))
    await nextTick()

    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.style.display).toBe('block')

    // Hide tooltip via blur
    targetElement.dispatchEvent(new FocusEvent('blur'))
    await nextTick()

    expect(tooltipElement?.style.display).toBe('none')
  })

  it('should show tooltip on focus even with delay configured', async () => {
    const delay = 500
    useTooltip({
      content: 'Test tooltip',
      targetRef: targetElement,
      delay,
    })

    // Trigger focus
    targetElement.dispatchEvent(new FocusEvent('focus'))

    await nextTick()

    // Focus should show tooltip immediately, ignoring delay
    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.style.display).toBe('block')
    expect(tooltipElement?.textContent).toBe('Test tooltip')
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

  it('should escape HTML by default', async () => {
    const htmlContent = '<script>alert("xss")</script>Safe text'
    useTooltip({
      content: htmlContent,
      targetRef: targetElement,
    })

    // Show tooltip
    targetElement.dispatchEvent(new MouseEvent('mouseenter'))
    vi.runAllTimers()
    await nextTick()

    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.textContent).toBe(htmlContent)
    expect(tooltipElement?.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;Safe text')
  })

  it('should support html content when contentTarget is set to innerHTML', async () => {
    const htmlContent = '<strong>Bold</strong> text'
    useTooltip({
      content: htmlContent,
      targetRef: targetElement,
      contentTarget: 'innerHTML',
    })

    // Show tooltip
    targetElement.dispatchEvent(new MouseEvent('mouseenter'))
    vi.runAllTimers()
    await nextTick()

    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.innerHTML).toBe(htmlContent)
    expect(tooltipElement?.textContent).toBe('Bold text')
  })

  it('should update contentTarget when it changes', async () => {
    const contentTarget = ref<'textContent' | 'innerHTML'>('textContent')
    const htmlContent = '<em>Italic</em> text'

    useTooltip({
      content: htmlContent,
      targetRef: targetElement,
      contentTarget,
    })

    // Show tooltip with textContent
    targetElement.dispatchEvent(new MouseEvent('mouseenter'))
    vi.runAllTimers()
    await nextTick()

    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.textContent).toBe(htmlContent)

    // Change to innerHTML
    contentTarget.value = 'innerHTML'
    await nextTick()

    expect(tooltipElement?.innerHTML).toBe(htmlContent)
    expect(tooltipElement?.textContent).toBe('Italic text')
  })

  it('should work with reactive content and contentTarget', async () => {
    const content = ref('Initial content')
    const contentTarget = ref<'textContent' | 'innerHTML'>('textContent')

    useTooltip({
      content,
      targetRef: targetElement,
      contentTarget,
    })

    // Show tooltip
    targetElement.dispatchEvent(new MouseEvent('mouseenter'))
    vi.runAllTimers()
    await nextTick()

    const tooltipElement = document.getElementById(ELEMENT_ID)
    expect(tooltipElement?.textContent).toBe('Initial content')

    // Update content to HTML
    content.value = '<strong>Bold</strong> content'
    await nextTick()

    // Should still be escaped as textContent
    expect(tooltipElement?.textContent).toBe('<strong>Bold</strong> content')

    // Switch to innerHTML
    contentTarget.value = 'innerHTML'
    await nextTick()

    // Should now render as HTML
    expect(tooltipElement?.innerHTML).toBe('<strong>Bold</strong> content')
    expect(tooltipElement?.textContent).toBe('Bold content')
  })
})
