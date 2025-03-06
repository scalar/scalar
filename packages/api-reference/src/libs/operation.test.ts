import { XScalarStability } from '@scalar/types/legacy'
import { describe, expect, it } from 'vitest'

import { operationSchema } from '@scalar/oas-utils/entities/spec'
import { getOperationStability, isOperationDeprecated } from './operation'

describe('isOperationDeprecated', () => {
  it('is deprecated when marked as such', async () => {
    const operation = operationSchema.parse({
      httpVerb: 'GET',
      path: '/foo',
      deprecated: true,
    })

    expect(isOperationDeprecated(operation)).toBe(true)
  })

  it('is deprecated for x-scalar-stability deprecated', async () => {
    const operation = operationSchema.parse({
      httpVerb: 'GET',
      path: '/foo',
      'x-scalar-stability': XScalarStability.Deprecated,
    })

    expect(isOperationDeprecated(operation)).toBe(true)
  })

  it('is not deprecated for other x-scalar-stability', async () => {
    const operation = operationSchema.parse({
      httpVerb: 'GET',
      path: '/foo',
      'x-scalar-stability': XScalarStability.Stable,
    })

    expect(isOperationDeprecated(operation)).toBe(false)
  })

  it('deprecated property takes precedence', async () => {
    const operation = operationSchema.parse({
      httpVerb: 'GET',
      path: '/foo',
      'x-scalar-stability': XScalarStability.Deprecated,
      deprecated: false,
    })

    expect(isOperationDeprecated(operation)).toBe(false)
  })
})

describe('getOperationStability', () => {
  it('returns deprecated when marked as such', async () => {
    const operation = operationSchema.parse({
      httpVerb: 'GET',
      path: '/foo',
      deprecated: true,
    })

    expect(getOperationStability(operation)).toBe(XScalarStability.Deprecated)
  })

  it('returns x-scalar-stability value', async () => {
    const operation = operationSchema.parse({
      httpVerb: 'GET',
      path: '/foo',
      'x-scalar-stability': XScalarStability.Stable,
    })

    expect(getOperationStability(operation)).toBe(XScalarStability.Stable)
  })

  it('returns undefined when no stability information is present', async () => {
    const operation = operationSchema.parse({
      httpVerb: 'GET',
      path: '/foo',
    })

    expect(getOperationStability(operation)).toBeUndefined()
  })
})
