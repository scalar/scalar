import { Type } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/coerce-value'
import { REF_DEFINITIONS } from '@/schemas/v3.1/strict/ref-definitions'
import { SecurityRequirementObjectSchemaDefinition } from '@/schemas/v3.1/strict/security-requirement'

import { XScalarSelectedSecuritySchema } from './x-scalar-selected-security'

/**
 * Create a test module that registers the SecurityRequirementObject definition
 * so that Type.Ref can resolve it during validation.
 */
const createTestModule = () =>
  Type.Module({
    [REF_DEFINITIONS.SecurityRequirementObject]: SecurityRequirementObjectSchemaDefinition,
    XScalarSelectedSecurity: XScalarSelectedSecuritySchema,
  })

describe('XScalarSelectedSecuritySchema', () => {
  it('validates a complete selected security object', () => {
    const testModule = createTestModule()
    const schema = testModule.Import('XScalarSelectedSecurity')

    const result = Value.Cast(schema, {
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [
          {
            apiKey: [],
          },
          {
            bearerAuth: ['read:users', 'write:users'],
          },
        ],
      },
    })

    expect(result).toEqual({
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [
          {
            apiKey: [],
          },
          {
            bearerAuth: ['read:users', 'write:users'],
          },
        ],
      },
    })
  })

  it('handles default values', () => {
    const result = coerceValue(XScalarSelectedSecuritySchema, { 'x-scalar-selected-security': {} })
    expect(result).toEqual({
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [],
      },
    })
  })

  it('validates multiple security schemes with different scopes', () => {
    const testModule = createTestModule()
    const schema = testModule.Import('XScalarSelectedSecurity')

    const result = Value.Cast(schema, {
      'x-scalar-selected-security': {
        selectedIndex: 2,
        selectedSchemes: [
          {
            oauth2: ['admin:org', 'read:org', 'write:org'],
          },
          {
            openIdConnect: [],
          },
          {
            basicAuth: [],
          },
        ],
      },
    })

    expect(result).toEqual({
      'x-scalar-selected-security': {
        selectedIndex: 2,
        selectedSchemes: [
          {
            oauth2: ['admin:org', 'read:org', 'write:org'],
          },
          {
            openIdConnect: [],
          },
          {
            basicAuth: [],
          },
        ],
      },
    })
  })
})
