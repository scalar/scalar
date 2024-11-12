import { describe, expect, it, vi } from 'vitest'
import { onBeforeUnmount } from 'vue'

import { useGoodbye } from './useGoodbye'

// Mock vue's onMounted
vi.mock('vue', () => ({
  onBeforeUnmount: vi.fn((fn) => fn()),
}))

describe('useGoodbye', () => {
  it('should log "Goodbye World" to console when mounted', () => {
    // Mock console.log
    const consoleSpy = vi.spyOn(console, 'log')

    // Call the hook
    useGoodbye()

    // Verify onBeforeUnmount was called
    expect(onBeforeUnmount).toHaveBeenCalled()

    // Verify console.log was called with correct message
    expect(consoleSpy).toHaveBeenCalledWith('Goodbye World')

    // Clean up
    consoleSpy.mockRestore()
  })
})
