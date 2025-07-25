import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { freezeAtTop } from './freeze-at-top'

// Mock DOM APIs
const mockScrollIntoView = vi.fn()
const mockGetElementById = vi.fn()
const mockRequestAnimationFrame = vi.fn()
const mockCancelAnimationFrame = vi.fn()
const mockMutationObserver = vi.fn()
const mockObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
}

// Mock DOM element
const createMockElement = () => ({
  scrollIntoView: mockScrollIntoView,
})

describe('freezeAtTop', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Setup global mocks
    global.document = {
      getElementById: mockGetElementById,
      body: {} as HTMLElement,
    } as any

    global.requestAnimationFrame = mockRequestAnimationFrame
    global.cancelAnimationFrame = mockCancelAnimationFrame
    global.MutationObserver = mockMutationObserver

    // Setup MutationObserver mock
    mockMutationObserver.mockImplementation(() => mockObserver)

    // Setup requestAnimationFrame mock to return a unique ID
    let rafId = 1
    mockRequestAnimationFrame.mockImplementation((callback) => {
      callback()
      return rafId++
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should create a MutationObserver with correct configuration', () => {
      freezeAtTop('test-id')

      expect(mockMutationObserver).toHaveBeenCalledTimes(1)
      expect(mockObserver.observe).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true,
      })
    })

    it('should return a cleanup function', () => {
      const cleanup = freezeAtTop('test-id')

      expect(typeof cleanup).toBe('function')
    })
  })

  describe('element detection and scroll behavior', () => {
    it('should scroll element into view when element exists', () => {
      const mockElement = createMockElement()
      mockGetElementById.mockReturnValue(mockElement)

      const cleanup = freezeAtTop('test-id')

      // Simulate mutation observer callback
      const observerCallback = mockMutationObserver?.mock.calls?.[0]?.[0]
      observerCallback([])

      expect(mockGetElementById).toHaveBeenCalledWith('test-id')
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1)
      expect(mockScrollIntoView).toHaveBeenCalledTimes(1)

      cleanup()
    })

    it('should not scroll when element does not exist', () => {
      mockGetElementById.mockReturnValue(null)

      const cleanup = freezeAtTop('test-id')

      // Simulate mutation observer callback
      const observerCallback = mockMutationObserver?.mock.calls?.[0]?.[0]
      observerCallback([])

      expect(mockGetElementById).toHaveBeenCalledWith('test-id')
      expect(mockRequestAnimationFrame).not.toHaveBeenCalled()
      expect(mockScrollIntoView).not.toHaveBeenCalled()

      cleanup()
    })

    it('should handle multiple mutations correctly', () => {
      const mockElement = createMockElement()
      mockGetElementById.mockReturnValue(mockElement)

      const cleanup = freezeAtTop('test-id')
      const observerCallback = mockMutationObserver?.mock.calls?.[0]?.[0]

      // Simulate multiple mutations
      observerCallback([{ type: 'childList' }])
      observerCallback([{ type: 'childList' }])
      observerCallback([{ type: 'childList' }])

      expect(mockScrollIntoView).toHaveBeenCalledTimes(3)
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(3)

      cleanup()
    })
  })

  describe('animation frame management', () => {
    it('should cancel pending animation frame before scheduling new one', () => {
      const mockElement = createMockElement()
      mockGetElementById.mockReturnValue(mockElement)

      const cleanup = freezeAtTop('test-id')
      const observerCallback = mockMutationObserver?.mock.calls?.[0]?.[0]

      // Simulate rapid mutations
      observerCallback([])
      observerCallback([])
      observerCallback([])

      // Should cancel previous frames before scheduling new ones
      expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(2) // Called for 2nd and 3rd mutations

      cleanup()
    })

    it('should handle animation frame cancellation correctly', () => {
      const mockElement = createMockElement()
      mockGetElementById.mockReturnValue(mockElement)

      // Mock requestAnimationFrame to return different IDs
      let rafId = 1
      mockRequestAnimationFrame.mockImplementation((callback) => {
        callback()
        return rafId++
      })

      const cleanup = freezeAtTop('test-id')
      const observerCallback = mockMutationObserver?.mock.calls?.[0]?.[0]

      observerCallback([])
      observerCallback([])

      expect(mockCancelAnimationFrame).toHaveBeenCalledWith(1)

      cleanup()
    })
  })

  describe('cleanup functionality', () => {
    it('should disconnect mutation observer on cleanup', () => {
      const cleanup = freezeAtTop('test-id')

      cleanup()

      expect(mockObserver.disconnect).toHaveBeenCalledTimes(1)
    })

    it('should cancel pending animation frame on cleanup', () => {
      const mockElement = createMockElement()
      mockGetElementById.mockReturnValue(mockElement)

      const cleanup = freezeAtTop('test-id')
      const observerCallback = mockMutationObserver?.mock.calls?.[0]?.[0]

      // Trigger a mutation to schedule an animation frame
      observerCallback([])

      cleanup()

      expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(1)
    })

    it('should not throw when cleaning up without pending animation frame', () => {
      const cleanup = freezeAtTop('test-id')

      expect(() => cleanup()).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle empty string id', () => {
      const cleanup = freezeAtTop('')

      expect(mockMutationObserver).not.toHaveBeenCalled()
      expect(mockObserver.observe).not.toHaveBeenCalled()

      cleanup()
    })

    it('should handle special characters in id', () => {
      const cleanup = freezeAtTop('test-id-with-special-chars_123')

      expect(mockMutationObserver).toHaveBeenCalledTimes(1)
      expect(mockObserver.observe).toHaveBeenCalledTimes(1)

      cleanup()
    })

    it('should handle rapid mutations efficiently', () => {
      const mockElement = createMockElement()
      mockGetElementById.mockReturnValue(mockElement)

      const cleanup = freezeAtTop('test-id')
      const observerCallback = mockMutationObserver?.mock.calls?.[0]?.[0]

      // Simulate 10 rapid mutations
      for (let i = 0; i < 10; i++) {
        observerCallback([])
      }

      // Should have called scrollIntoView 10 times
      expect(mockScrollIntoView).toHaveBeenCalledTimes(10)
      // Should have cancelled animation frames (except the first one)
      expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(9)

      cleanup()
    })
  })

  describe('integration scenarios', () => {
    it('should work with multiple freezeAtTop instances', () => {
      const mockElement1 = createMockElement()
      const mockElement2 = createMockElement()

      mockGetElementById.mockReturnValueOnce(mockElement1).mockReturnValueOnce(mockElement2)

      const cleanup1 = freezeAtTop('id1')
      const cleanup2 = freezeAtTop('id2')

      const observerCallback1 = mockMutationObserver?.mock.calls?.[0]?.[0]
      const observerCallback2 = mockMutationObserver?.mock.calls?.[1]?.[0]

      observerCallback1([])
      observerCallback2([])

      expect(mockScrollIntoView).toHaveBeenCalledTimes(2)
      expect(mockMutationObserver).toHaveBeenCalledTimes(2)

      cleanup1()
      cleanup2()
    })

    it('should handle cleanup during active observation', () => {
      const mockElement = createMockElement()
      mockGetElementById.mockReturnValue(mockElement)

      const cleanup = freezeAtTop('test-id')
      const observerCallback = mockMutationObserver?.mock.calls?.[0]?.[0]

      // Start a mutation
      observerCallback([])

      // Cleanup immediately
      cleanup()

      expect(mockObserver.disconnect).toHaveBeenCalledTimes(1)
      expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(1)
    })
  })
})
