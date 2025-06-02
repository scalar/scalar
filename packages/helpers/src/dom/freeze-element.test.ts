import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freezeElement } from './freeze-element'

describe('freezeElement', () => {
  let element: HTMLDivElement

  beforeEach(() => {
    // Setup test DOM element
    element = document.createElement('div')
    document.body.appendChild(element)
    vi.useFakeTimers()

    // Mock window.scrollBy more robustly
    Object.defineProperty(window, 'scrollBy', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('returns a cleanup function', () => {
    const unfreeze = freezeElement(element)
    expect(typeof unfreeze).toBe('function')
  })

  it('returns a no-op function when element is null', () => {
    const unfreeze = freezeElement(null as unknown as HTMLElement)
    expect(unfreeze()).toBeNull()
  })

  it('maintains element position when content changes', async () => {
    // Mock initial position
    const initialRect = { top: 100 } as DOMRect
    const movedRect = { top: 200 } as DOMRect

    let rectCallCount = 0
    element.getBoundingClientRect = vi.fn(() => {
      rectCallCount++
      return rectCallCount === 1 ? initialRect : movedRect
    })

    const unfreeze = freezeElement(element)

    // Simulate content change that would move the element
    const newElement = document.createElement('div')
    newElement.style.height = '100px'
    document.body.insertBefore(newElement, element)

    // Let MutationObserver process the change
    await flushPromises()

    // Verify window.scrollBy was called to adjust position
    expect(window.scrollBy).toHaveBeenCalledWith(0, 100)

    unfreeze()
  })

  it('stops maintaining position after unfreeze is called', () => {
    const unfreeze = freezeElement(element)

    // Important: Call unfreeze before making changes
    unfreeze()

    // Clear any previous calls to scrollBy
    vi.mocked(window.scrollBy).mockClear()

    // Simulate content change
    const newElement = document.createElement('div')
    document.body.insertBefore(newElement, element)

    // Let MutationObserver process the change
    vi.runAllTimers()

    // Verify window.scrollBy was not called after unfreezing
    expect(window.scrollBy).not.toHaveBeenCalled()
  })

  it('adjusts scroll by the correct amount', async () => {
    // Mock getBoundingClientRect to simulate element movement
    const initialRect = { top: 100 } as DOMRect
    const movedRect = { top: 200 } as DOMRect

    let rectCallCount = 0
    element.getBoundingClientRect = vi.fn(() => {
      rectCallCount++
      return rectCallCount === 1 ? initialRect : movedRect
    })

    freezeElement(element)

    // Simulate content change
    const newElement = document.createElement('div')
    document.body.insertBefore(newElement, element)

    await flushPromises()

    // Should scroll by the difference (200 - 100 = 100)
    expect(window.scrollBy).toHaveBeenCalledWith(0, 100)
  })
})
