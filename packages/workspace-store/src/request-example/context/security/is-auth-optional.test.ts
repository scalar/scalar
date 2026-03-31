import { describe, expect, it } from 'vitest'

import { isAuthOptional } from './is-auth-optional'

describe('isAuthOptional', () => {
  it('returns true when there is an empty requirement and no complex requirements', () => {
    const securityRequirements = [
      { apiKey: [] },
      {}, // Empty requirement makes auth optional
    ]

    const result = isAuthOptional(securityRequirements)
    expect(result).toBe(true)
  })

  it('returns false when there is an empty requirement but also a complex requirement', () => {
    const securityRequirements = [
      { oauth2: [], apiKey: [] }, // Complex requirement (multiple keys)
      {}, // Empty requirement
    ]

    const result = isAuthOptional(securityRequirements)
    expect(result).toBe(false)
  })

  it('returns false when there are no empty requirements', () => {
    const securityRequirements = [{ apiKey: [] }, { oauth2: [] }]
    const result = isAuthOptional(securityRequirements)
    expect(result).toBe(false)
  })

  it('returns false when the security requirements array is empty', () => {
    const securityRequirements: Array<Record<string, string[]>> = []
    const result = isAuthOptional(securityRequirements)
    expect(result).toBe(false)
  })
})
