import { describe, expect, it, vi } from 'vitest'

import { useToasts } from './useToasts'

describe('useToasts', () => {
  it('should initialize and call the toast function with default parameters', () => {
    const mockToastFunction = vi.fn()
    const { initializeToasts, toast } = useToasts()

    initializeToasts(mockToastFunction)

    toast('Toast popped!')

    expect(mockToastFunction).toHaveBeenCalledTimes(1)
    expect(mockToastFunction).toHaveBeenCalledWith('Toast popped!', 'info', {
      timeout: 3000,
    })
  })

  it('should handle calls with specific parameters', () => {
    const mockToastFunction = vi.fn()
    const { initializeToasts, toast } = useToasts()

    initializeToasts(mockToastFunction)

    toast('Toast burnt!', 'error', { timeout: 5000 })

    expect(mockToastFunction).toHaveBeenCalledTimes(1)
    expect(mockToastFunction).toHaveBeenCalledWith('Toast burnt!', 'error', {
      timeout: 5000,
    })
  })
})
