import { vi } from 'vitest'

/**
 * Creates a controllable requestIdleCallback mock for testing.
 * Collects scheduled callbacks and allows tests to run them deterministically.
 *
 * @example
 * const ricController = mockRequestIdleCallbackController()
 *
 * // In your test
 * const wrapper = mount(Component)
 *
 * // Later, manually trigger the idle callback
 * ricController.runNext()
 * await nextTick()
 */
export const mockRequestIdleCallbackController = () => {
  type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number }
  type IdleCallback = (deadline: IdleDeadline) => void

  const queue: IdleCallback[] = []

  const mock = vi.fn((cb: IdleCallback) => {
    queue.push(cb)
    // Return a pseudo handle
    return queue.length
  })

  const createDeadline = (): IdleDeadline => ({
    didTimeout: false,
    timeRemaining: () => 50,
  })

  const runNext = () => {
    const cb = queue.shift()
    if (cb) {
      cb(createDeadline())
    }
  }

  const flushAll = () => {
    while (queue.length) {
      runNext()
    }
  }

  return { mock, runNext, flushAll, queue }
}
