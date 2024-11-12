import { describe, expect, it, vi } from 'vitest'
import { onMounted } from 'vue'

import { useHello } from './useHello'

// Mock vue's onMounted
vi.mock('vue', () => ({
  onMounted: vi.fn((fn) => fn()),
}))

describe('useHello', () => {
  it('should log "Hello World" to console when mounted', () => {
    // Mock console.log
    const consoleSpy = vi.spyOn(console, 'log')

    // Call the hook
    useHello()

    // Verify onMounted was called
    expect(onMounted).toHaveBeenCalled()

    // Verify console.log was called with correct message
    expect(consoleSpy).toHaveBeenCalledWith('Hello World')

    // Clean up
    consoleSpy.mockRestore()
  })
})
