import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollToId } from './scroll-to-id'

describe('scroll-to-id', () => {
  let mockElement: HTMLElement
  let originalGetElementById: typeof document.getElementById
  let originalRequestAnimationFrame: typeof requestAnimationFrame

  beforeEach(() => {
    // Setup test DOM element
    mockElement = document.createElement('div')
    mockElement.id = 'test-element'
    document.body.appendChild(mockElement)

    // Mock scrollIntoView and focus
    mockElement.scrollIntoView = vi.fn()
    mockElement.focus = vi.fn()

    // Store original methods
    originalGetElementById = document.getElementById
    originalRequestAnimationFrame = globalThis.requestAnimationFrame

    // Mock Date.now for timing tests
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.innerHTML = ''

    // Restore original methods
    document.getElementById = originalGetElementById
    globalThis.requestAnimationFrame = originalRequestAnimationFrame

    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('scrolls to element when found immediately', async () => {
    await scrollToId('test-element')

    expect(mockElement.scrollIntoView).toHaveBeenCalledOnce()
  })

  it('retries finding element using requestAnimationFrame', async () => {
    let callCount = 0

    document.getElementById = vi.fn().mockImplementation((id) => {
      callCount++
      if (callCount === 1) {
        return null
      }

      return id === 'test-element' ? mockElement : null
    })

    const rafCallbacks: FrameRequestCallback[] = []

    globalThis.requestAnimationFrame = vi.fn((callback) => {
      rafCallbacks.push(callback)
      return 1
    })

    await scrollToId('test-element')

    rafCallbacks[0]?.(0)

    expect(document.getElementById).toHaveBeenCalledTimes(2)
    expect(mockElement.scrollIntoView).toHaveBeenCalledOnce()
  })

  it('stops retrying after 1 second timeout', async () => {
    document.getElementById = vi.fn().mockReturnValue(null)

    let currentTime = 0
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime)

    const rafCallbacks: FrameRequestCallback[] = []

    const mockRaf = vi.fn((callback) => {
      rafCallbacks.push(callback)
      return rafCallbacks.length
    })
    globalThis.requestAnimationFrame = mockRaf

    scrollToId('non-existent-element')

    rafCallbacks[0]?.(0)
    expect(mockRaf).toHaveBeenCalledTimes(2)

    currentTime = 1001

    rafCallbacks[1]?.(0)
    expect(mockRaf).toHaveBeenCalledTimes(2)
  })

  it('handles all parameters correctly', async () => {
    await scrollToId('test-element', true)

    expect(mockElement.scrollIntoView).toHaveBeenCalledOnce()
    expect(mockElement.focus).toHaveBeenCalledOnce()
  })
})
