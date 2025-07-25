import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freezeElement } from './freeze-element'

describe('freezeElement', () => {
  let container: HTMLDivElement
  let targetElement: HTMLDivElement
  let getBoundingClientRectSpy: MockInstance<() => DOMRect>
  let scrollBySpy: MockInstance<() => [x: number, y: number]>
  let cancelAnimationFrameSpy: MockInstance<() => [handle: number]>
  let disconnectSpy: MockInstance<() => void>

  beforeEach(() => {
    // Set up DOM elements
    container = document.createElement('div')
    targetElement = document.createElement('div')
    targetElement.id = 'target'
    targetElement.style.height = '100px'
    container.appendChild(targetElement)
    document.body.appendChild(container)

    // Mock getBoundingClientRect
    getBoundingClientRectSpy = vi.spyOn(targetElement, 'getBoundingClientRect')
    getBoundingClientRectSpy.mockReturnValue({
      top: 100,
      bottom: 200,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 100,
      toJSON: () => {},
    })

    // Set up spies
    scrollBySpy = vi.spyOn(window, 'scrollBy')
    cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')
    disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect')
  })

  afterEach(() => {
    // Clean up
    document.body.removeChild(container)
    vi.clearAllMocks()
  })

  it('returns a cleanup function', () => {
    const unfreeze = freezeElement(targetElement)
    expect(typeof unfreeze).toBe('function')
    unfreeze()
  })

  it('returns no-op function when element is null', () => {
    const unfreeze = freezeElement(null as unknown as HTMLElement)
    expect(typeof unfreeze).toBe('function')
    unfreeze()
  })

  it('maintains scroll position when content changes', async () => {
    const unfreeze = freezeElement(targetElement)

    // Simulate content change that would move the element
    getBoundingClientRectSpy.mockReturnValueOnce({
      top: 150, // Element moved down by 50px
      bottom: 250,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 150,
      toJSON: () => {},
    })

    // Trigger a mutation by modifying the DOM
    const child = document.createElement('div')
    targetElement.appendChild(child)

    // Wait for the next frame
    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(scrollBySpy).toHaveBeenCalledWith(0, 50)
    unfreeze()
  })

  it('does not adjust scroll when element position has not changed', async () => {
    const unfreeze = freezeElement(targetElement)

    // Simulate content change that doesn't move the element
    getBoundingClientRectSpy.mockReturnValueOnce({
      top: 100, // Same position
      bottom: 200,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 100,
      toJSON: () => {},
    })

    // Trigger a mutation by modifying the DOM
    const child = document.createElement('div')
    targetElement.appendChild(child)

    // Wait for the next frame
    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(scrollBySpy).not.toHaveBeenCalled()
    unfreeze()
  })

  it('only processes relevant mutations', async () => {
    const unfreeze = freezeElement(targetElement)

    // Trigger a mutation that shouldn't affect layout
    targetElement.textContent = 'New text content'

    // Wait for the next frame
    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(scrollBySpy).not.toHaveBeenCalled()
    unfreeze()
  })

  it('cancels pending animation frame when new mutation occurs', async () => {
    const unfreeze = freezeElement(targetElement)

    // Trigger first mutation
    const child1 = document.createElement('div')
    targetElement.appendChild(child1)

    // Small delay to ensure first mutation is processed
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Trigger second mutation before the first frame executes
    const child2 = document.createElement('div')
    targetElement.appendChild(child2)

    // Wait for the next frame
    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(cancelAnimationFrameSpy).toHaveBeenCalled()
    unfreeze()
  })

  it('cleans up observer and animation frame on unfreeze', () => {
    const unfreeze = freezeElement(targetElement)
    unfreeze()

    expect(disconnectSpy).toHaveBeenCalled()
    // Note: We can't directly test cancelAnimationFrame here as it might not be called
    // if no animation frame was pending
  })
})
