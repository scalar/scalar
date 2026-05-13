import { describe, expect, it } from 'vitest'

import { compareVersions, isVersionLessThan, isVersionLessThanOrEqual } from './compare-versions'

describe('compareVersions', () => {
  it('returns 0 for identical versions', () => {
    expect(compareVersions('3.5.1', '3.5.1')).toBe(0)
  })

  it('returns a negative number when the first version is lower', () => {
    expect(compareVersions('3.5.0', '3.5.1')).toBeLessThan(0)
    expect(compareVersions('3.4.9', '3.5.0')).toBeLessThan(0)
    expect(compareVersions('2.99.99', '3.0.0')).toBeLessThan(0)
  })

  it('returns a positive number when the first version is higher', () => {
    expect(compareVersions('3.5.2', '3.5.1')).toBeGreaterThan(0)
    expect(compareVersions('4.0.0', '3.99.99')).toBeGreaterThan(0)
  })

  it('treats missing segments as zero', () => {
    expect(compareVersions('3', '3.0.0')).toBe(0)
    expect(compareVersions('3.5', '3.5.0')).toBe(0)
  })

  it('ignores build metadata after a plus sign', () => {
    expect(compareVersions('1.0.0+abc', '1.0.0+xyz')).toBe(0)
  })

  it('treats pre-release versions as lower than the equivalent stable version', () => {
    expect(compareVersions('1.0.0-rc.1', '1.0.0')).toBeLessThan(0)
    expect(compareVersions('1.0.0', '1.0.0-rc.1')).toBeGreaterThan(0)
  })

  it('compares numeric pre-release identifiers numerically', () => {
    expect(compareVersions('1.0.0-rc.2', '1.0.0-rc.10')).toBeLessThan(0)
  })

  it('preserves hyphens inside the pre-release identifier', () => {
    expect(compareVersions('1.0.0-beta-1', '1.0.0-beta-2')).toBeLessThan(0)
    expect(compareVersions('1.0.0-beta-2', '1.0.0-beta-1')).toBeGreaterThan(0)
  })

  it('orders shorter pre-release chains before longer ones with the same prefix', () => {
    expect(compareVersions('1.0.0-rc', '1.0.0-rc.1')).toBeLessThan(0)
  })

  it('orders numeric pre-release identifiers below alphanumeric ones', () => {
    expect(compareVersions('1.0.0-1', '1.0.0-alpha')).toBeLessThan(0)
  })
})

describe('isVersionLessThan', () => {
  it('is true when the first version is lower', () => {
    expect(isVersionLessThan('1.2.3', '1.2.4')).toBe(true)
    expect(isVersionLessThan('1.2.3', '1.3.0')).toBe(true)
    expect(isVersionLessThan('1.2.3', '2.0.0')).toBe(true)
  })

  it('is false when the first version is greater or equal', () => {
    expect(isVersionLessThan('1.2.4', '1.2.3')).toBe(false)
    expect(isVersionLessThan('1.3.0', '1.2.3')).toBe(false)
    expect(isVersionLessThan('2.0.0', '1.2.3')).toBe(false)
    expect(isVersionLessThan('1.2.3', '1.2.3')).toBe(false)
  })

  it('treats missing segments like compareVersions (parity with legacy migration checks)', () => {
    expect(isVersionLessThan('1', '1.0.0')).toBe(false)
    expect(isVersionLessThan('1.2', '1.2.0')).toBe(false)
    expect(isVersionLessThan('1.0', '1.1.0')).toBe(true)
  })
})

describe('isVersionLessThanOrEqual', () => {
  it('is true when versions match', () => {
    expect(isVersionLessThanOrEqual('3.5.1', '3.5.1')).toBe(true)
  })

  it('is true when the first version is lower', () => {
    expect(isVersionLessThanOrEqual('3.4.0', '3.5.1')).toBe(true)
  })

  it('is false when the first version is higher', () => {
    expect(isVersionLessThanOrEqual('3.6.0', '3.5.1')).toBe(false)
  })
})
