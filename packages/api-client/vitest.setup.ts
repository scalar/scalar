import { beforeAll, vi } from 'vitest'

/**
 * Mock ResizeObserver which is used by @headlessui/vue Dialog component
 * but is not available in the test environment. If you need to test it you can set your own mock in the test file.
 *
 * @see https://github.com/jsdom/jsdom/issues/3368
 */
beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))
})
