import { beforeEach, describe, expect, it, vi } from 'vitest'

import { scrollToId } from './scroll-to-id'

describe('scroll-to-id', () => {
  const getElementByIdSpy = vi.spyOn(document, 'getElementById')
  const requestAnimationFrameSpy = vi.spyOn(global, 'requestAnimationFrame')

  let mockElement: HTMLElement

  beforeEach(() => {
    // Setup test DOM element
    mockElement = document.createElement('div')
    mockElement.id = 'test-element'
    document.body.appendChild(mockElement)

    // Mock scrollIntoView and focus
    mockElement.scrollIntoView = vi.fn()
    mockElement.focus = vi.fn()

    // Mock Date.now for timing tests
    vi.useFakeTimers()

    return () => {
      document.body.removeChild(mockElement)

      vi.resetAllMocks()
      vi.useRealTimers()
    }
  })

  it('scrolls to element when found immediately', () => {
    scrollToId('test-element')

    expect(mockElement.scrollIntoView).toHaveBeenCalledOnce()
  })

  it('retries finding element using requestAnimationFrame', () => {
    let callCount = 0

    getElementByIdSpy.mockImplementation((id) => {
      callCount++
      if (callCount === 1) {
        return null
      }

      return id === 'test-element' ? mockElement : null
    })

    const rafCallbacks: FrameRequestCallback[] = []

    requestAnimationFrameSpy.mockImplementation((callback) => {
      rafCallbacks.push(callback)
      return 1
    })

    scrollToId('test-element')

    rafCallbacks[0]?.(0)

    expect(getElementByIdSpy).toHaveBeenCalledTimes(2)
    expect(mockElement.scrollIntoView).toHaveBeenCalledOnce()
  })

  it('stops retrying after 1 second timeout', () => {
    getElementByIdSpy.mockReturnValue(null)

    let currentTime = 0
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime)

    const rafCallbacks: FrameRequestCallback[] = []

    requestAnimationFrameSpy.mockImplementation((callback) => {
      rafCallbacks.push(callback)
      return rafCallbacks.length
    })

    scrollToId('non-existent-element')

    rafCallbacks[0]?.(0)
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2)

    currentTime = 1001

    rafCallbacks[1]?.(0)
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2)
  })

  it('handles all parameters correctly', () => {
    scrollToId('test-element', true)

    expect(mockElement.scrollIntoView).toHaveBeenCalledOnce()
    expect(mockElement.focus).toHaveBeenCalledOnce()
  })
})
