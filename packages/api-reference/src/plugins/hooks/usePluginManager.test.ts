import { describe, expect, it } from 'vitest'
import { usePluginManager } from './usePluginManager'

describe('usePluginManager', () => {
  it('creates a new plugin manager if none is injected', () => {
    const result = usePluginManager()
    expect(result).toBeDefined()
  })
})
