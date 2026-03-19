import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
  /**
   * Mock ResizeObserver which is not available in the jsdom test environment.
   *
   * @see https://github.com/jsdom/jsdom/issues/3368
   */
  globalThis.ResizeObserver = class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  }

  /**
   * Mock IntersectionObserver which is not available in the jsdom test environment.
   *
   * @see https://github.com/jsdom/jsdom/issues/2032
   */
  globalThis.IntersectionObserver = class {
    constructor(public callback: IntersectionObserverCallback) {}
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = [] as number[]
  }
})

afterEach(() => {
  vi.clearAllMocks()
})
