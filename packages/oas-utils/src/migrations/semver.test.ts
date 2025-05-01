import { describe, expect, it } from 'vitest'

import { semverLessThan } from './semver'

describe('compareSemVer', () => {
  it('should return true if version1 is less than version2', () => {
    expect(semverLessThan('1.2.3', '1.2.4')).toBe(true)
    expect(semverLessThan('1.2.3', '1.3.0')).toBe(true)
    expect(semverLessThan('1.2.3', '2.0.0')).toBe(true)
  })

  it('should return false if version1 is not less than version2', () => {
    expect(semverLessThan('1.2.4', '1.2.3')).toBe(false)
    expect(semverLessThan('1.3.0', '1.2.3')).toBe(false)
    expect(semverLessThan('2.0.0', '1.2.3')).toBe(false)
    expect(semverLessThan('1.2.3', '1.2.3')).toBe(false)
  })

  it('should handle missing minor and patch versions correctly', () => {
    expect(semverLessThan('1', '1.0.0')).toBe(false)
    expect(semverLessThan('1.2', '1.2.0')).toBe(false)
    expect(semverLessThan('1.0', '1.1.0')).toBe(true)
  })
})
