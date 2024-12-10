import { describe, expect, it } from 'vitest'

import { getAvailableTargets } from './getAvailableTargets'

describe('getAvailableTargets', () => {
  it('should return all available targets', () => {
    const targets = getAvailableTargets()

    expect(targets).toBeDefined()
    expect(targets.length).toBeGreaterThan(0)
    expect(targets[0].key).toBe('c')
    expect(targets[0].title).toBe('C')
    expect(targets[0].default).toBe('libcurl')
    expect(targets[0].clients).toEqual(['libcurl'])
  })
})
