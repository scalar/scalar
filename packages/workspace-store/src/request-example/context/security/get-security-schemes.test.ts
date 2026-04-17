import { describe, expect, it } from 'vitest'

import type { MergedSecuritySchemes } from '@/request-example/context/security/merge-security'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'

import { getSecuritySchemes } from './get-security-schemes'

const createSchemes = (overrides: Partial<MergedSecuritySchemes> = {}): MergedSecuritySchemes => ({
  apiKey: {
    type: 'apiKey',
    name: 'X-API-Key',
    in: 'header',
    'x-scalar-secret-token': 'secret-1',
  },
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    'x-scalar-secret-token': 'jwt-token',
    'x-scalar-secret-username': '',
    'x-scalar-secret-password': '',
  },
  ...overrides,
})

describe('get-security-schemes', () => {
  it('resolves a single scheme from a security requirement', () => {
    const schemes = createSchemes()
    const selected: SecurityRequirementObject = { apiKey: [] }

    const result = getSecuritySchemes(schemes, selected)

    expect(result).toStrictEqual([schemes.apiKey])
  })

  it('resolves multiple schemes from a combined security requirement', () => {
    const schemes = createSchemes()
    const selected: SecurityRequirementObject = { apiKey: [], bearerAuth: [] }

    const result = getSecuritySchemes(schemes, selected)

    expect(result).toStrictEqual([schemes.apiKey, schemes.bearerAuth])
  })

  it('skips keys that do not exist in securitySchemes', () => {
    const schemes = createSchemes()
    const selected: SecurityRequirementObject = { nonExistent: [] }

    const result = getSecuritySchemes(schemes, selected)

    expect(result).toStrictEqual([])
  })

  it('returns an empty array for an empty security requirement', () => {
    const schemes = createSchemes()
    const selected: SecurityRequirementObject = {}

    const result = getSecuritySchemes(schemes, selected)

    expect(result).toStrictEqual([])
  })

  it('filters out missing schemes while keeping valid ones', () => {
    const schemes = createSchemes()
    const selected: SecurityRequirementObject = { apiKey: [], missing: [], bearerAuth: [] }

    const result = getSecuritySchemes(schemes, selected)

    expect(result).toStrictEqual([schemes.apiKey, schemes.bearerAuth])
  })
})
