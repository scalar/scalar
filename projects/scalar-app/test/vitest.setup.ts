import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  /**
   * Mock ResizeObserver which is used by @headlessui/vue Dialog and a few
   * other components but is not available in jsdom. Tests that need a
   * different implementation can override `globalThis.ResizeObserver`.
   *
   * @see https://github.com/jsdom/jsdom/issues/3368
   */
  globalThis.ResizeObserver = class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  }

  /**
   * Mock IntersectionObserver which is used by various components but is
   * not available in jsdom.
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
