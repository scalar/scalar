import { describe, expect, it, vi } from 'vitest'
import { inject } from 'vue'

import { useProvideTeleport, useTeleport } from './useTeleport'

// Mock vue's inject
vi.mock('vue', () => ({
  inject: vi.fn(),
  provide: vi.fn(),
  useId: () => 'generated-id',
}))

describe('useTeleport', () => {
  it('returns "body" when no teleport target is injected', () => {
    vi.mocked(inject).mockReturnValue(undefined)
    const target = useTeleport()
    expect(target).toBe('body')
  })

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
    expect(result).toBe('generated-id')
  })
})
