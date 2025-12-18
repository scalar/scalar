import { describe, expect, it } from 'vitest'

import { isNonOptionalSecurityRequirement } from './is-non-optional-security-requirement'

describe('isNonOptionalSecurityRequirement', () => {
  it('returns true for security requirement with single scheme', () => {
    const requirement = { apiKey: [] }
    const result = isNonOptionalSecurityRequirement(requirement)
    expect(result).toBe(true)
  })

  it('returns true for security requirement with multiple schemes', () => {
    const requirement = { apiKey: [], oauth2: ['read', 'write'] }
    const result = isNonOptionalSecurityRequirement(requirement)
    expect(result).toBe(true)
  })

  it('returns false for empty security requirement object', () => {
    const requirement = {}
    const result = isNonOptionalSecurityRequirement(requirement)
    expect(result).toBe(false)
  })

  it('returns true for security requirement with scopes', () => {
    const requirement = { oauth2: ['read:users', 'write:users'] }
    const result = isNonOptionalSecurityRequirement(requirement)
    expect(result).toBe(true)
  })

  // Type guard tests
  it('narrows type to exclude empty object when true', () => {
    const requirement: Record<string, string[]> | {} = { bearer: [] }

    if (isNonOptionalSecurityRequirement(requirement)) {
      // Type should be narrowed to Record<string, string[]>
      const keys: string[] = Object.keys(requirement)
      expect(keys.length).toBeGreaterThan(0)
      // This line would cause a TypeScript error if type guard did not work
      expect(requirement.bearer).toBeDefined()
    }
  })

  it('correctly identifies type when false', () => {
    const requirement: Record<string, string[]> | {} = {}

    if (!isNonOptionalSecurityRequirement(requirement)) {
      // Type should still be the union, but we know it is empty
      const keys = Object.keys(requirement)
      expect(keys.length).toBe(0)
    } else {
      // This branch should not execute
      expect.fail('Should not reach this branch')
    }
  })
})
