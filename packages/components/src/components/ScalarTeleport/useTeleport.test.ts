import { describe, expect, it, vi } from 'vitest'
import { inject } from 'vue'

import { useProvideTeleport, useTeleport } from './useTeleport'

// Mock vue's inject
vi.mock('vue', () => ({
  inject: vi.fn(),
  provide: vi.fn(),
}))

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('1234567890'),
}))

describe('useTeleport', () => {
  it('returns the injected teleport target when available', () => {
    vi.mocked(inject).mockReturnValue('#custom-target')
    const target = useTeleport()
    expect(target).toBe('#custom-target')
  })
})

describe('useProvideTeleport', () => {
  it('provides a custom target ID when specified', () => {
    const customId = 'custom-target'
    const result = useProvideTeleport(customId)
    expect(result).toBe(customId)
  })

  it('generates a target ID when none is specified', () => {
    const result = useProvideTeleport()
    expect(result).toBe('scalar-teleport-1234567890')
  })
})
