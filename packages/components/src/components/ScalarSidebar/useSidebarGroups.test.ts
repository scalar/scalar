import { beforeEach, describe, expect, it, vi } from 'vitest'
import { inject, provide } from 'vue'

import { SIDEBAR_GROUPS_SYMBOL, useSidebarGroups } from './useSidebarGroups'

// Mock vue's inject/provide
vi.mock('vue', () => ({
  inject: vi.fn(),
  provide: vi.fn(),
}))

describe('useSidebarGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return default level 0 when no level is injected', () => {
    vi.mocked(inject).mockReturnValue(0)

    const { level } = useSidebarGroups()

    expect(level).toBe(0)
    expect(provide).toHaveBeenCalledWith(SIDEBAR_GROUPS_SYMBOL, 0)
  })

  it('should return injected level without incrementing', () => {
    vi.mocked(inject).mockReturnValue(2)

    const { level } = useSidebarGroups()

    expect(level).toBe(2)
    expect(provide).toHaveBeenCalledWith(SIDEBAR_GROUPS_SYMBOL, 2)
  })

  it('should increment level when increment option is true', () => {
    vi.mocked(inject).mockReturnValue(1)

    const { level } = useSidebarGroups({ increment: true })

    expect(level).toBe(1)
    expect(provide).toHaveBeenCalledWith(SIDEBAR_GROUPS_SYMBOL, 2)
  })

  it('should not increment beyond level 6', () => {
    vi.mocked(inject).mockReturnValue(6)

    const { level } = useSidebarGroups({ increment: true })

    expect(level).toBe(6)
    expect(provide).toHaveBeenCalledWith(SIDEBAR_GROUPS_SYMBOL, 6)
  })

  it('should handle level 0 increment correctly', () => {
    vi.mocked(inject).mockReturnValue(0)

    const { level } = useSidebarGroups({ increment: true })

    expect(level).toBe(0)
    expect(provide).toHaveBeenCalledWith(SIDEBAR_GROUPS_SYMBOL, 1)
  })
})
