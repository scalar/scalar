import { describe, expect, it } from 'vitest'

import { getSecurityRequirements } from './get-security-requirements'

describe('get-security-requirements', () => {
  it('returns operation security when it has specific requirements', () => {
    const documentSecurity = [{ apiKey: [] }]
    const operationSecurity = [{ oauth2: ['read:users'] }]

    const result = getSecurityRequirements(documentSecurity, operationSecurity)

    expect(result).toEqual([{ oauth2: ['read:users'] }])
  })

  it('returns document security when operation security is [{}] and document already has optional security', () => {
    const documentSecurity = [{ apiKey: [] }, {}]
    const operationSecurity = [{}]

    const result = getSecurityRequirements(documentSecurity, operationSecurity)

    // Document security is returned as-is because it already includes optional
    expect(result).toEqual([{ apiKey: [] }, {}])
  })

  it('adds optional security to document security when operation security is [{}] and document does not have optional', () => {
    const documentSecurity = [{ apiKey: [] }, { oauth2: ['read'] }]
    const operationSecurity = [{}]

    const result = getSecurityRequirements(documentSecurity, operationSecurity)

    // Optional security object is added to document security
    expect(result).toEqual([{ apiKey: [] }, { oauth2: ['read'] }, {}])
  })

  it('returns document security when operation security is undefined', () => {
    const documentSecurity = [{ bearerAuth: [] }]

    const result = getSecurityRequirements(documentSecurity, undefined)
    expect(result).toEqual([{ bearerAuth: [] }])
  })

  it('returns empty array when both operation and document security are undefined', () => {
    const result = getSecurityRequirements(undefined, undefined)
    expect(result).toEqual([])
  })
})
