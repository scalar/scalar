import { afterEach, describe, expect, it, vi } from 'vitest'

import { useToasts } from './useToasts'

/** Unregisters every toaster a test registered, since the registry is shared module state */
const cleanups: (() => void)[] = []

describe('useToasts', () => {
  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup())
  })

  it('should initialize and call the toast function with default parameters', () => {
    const mockToastFunction = vi.fn()
    const { initializeToasts, toast } = useToasts()

    cleanups.push(initializeToasts(mockToastFunction))

    toast('Toast popped!')

    expect(mockToastFunction).toHaveBeenCalledTimes(1)
    expect(mockToastFunction).toHaveBeenCalledWith('Toast popped!', 'info', {
      timeout: 3000,
    })
  })

  it('should handle calls with specific parameters', () => {
    const mockToastFunction = vi.fn()
    const { initializeToasts, toast } = useToasts()

    cleanups.push(initializeToasts(mockToastFunction))

    toast('Toast burnt!', 'error', { timeout: 5000 })

    expect(mockToastFunction).toHaveBeenCalledTimes(1)
    expect(mockToastFunction).toHaveBeenCalledWith('Toast burnt!', 'error', {
      timeout: 5000,
    })
  })

  it('skips a newer toaster the user cannot see for an older one they can', () => {
    const visible = vi.fn()
    const hidden = vi.fn()
    const { initializeToasts, toast } = useToasts()

    cleanups.push(initializeToasts(visible))
    cleanups.push(initializeToasts(hidden, { isAvailable: () => false }))

    toast('Export failed', 'error')

    expect(visible).toHaveBeenCalledOnce()
    expect(hidden).not.toHaveBeenCalled()
  })

  it('stops sending toasts to a toaster once it unregisters', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { initializeToasts, toast } = useToasts()

    cleanups.push(initializeToasts(first))
    const unregister = initializeToasts(second)
    unregister()

    toast('Saved')

    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
  })
})
