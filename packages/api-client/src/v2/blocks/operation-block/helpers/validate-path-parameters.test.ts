import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { validatePathParameters } from './validate-path-parameters'

/** Helper to create a parameter with an example value */
const createPathParam = (name: string, value: unknown) =>
  ({
    name,
    in: 'path',
    required: true,
    example: value,
  }) as ParameterObject

describe('validatePathParameters', () => {
  it('returns empty array when all path params have values', () => {
    const params = [createPathParam('userId', '123')]
    expect(validatePathParameters(params)).toEqual([])
  })

  it('returns param names for empty string values', () => {
    const params = [createPathParam('userId', '')]
    expect(validatePathParameters(params)).toEqual(['userId'])
  })

  it('returns param names for whitespace-only values', () => {
    const params = [createPathParam('userId', '   ')]
    expect(validatePathParameters(params)).toEqual(['userId'])
  })

  it('returns param names when no example exists', () => {
    const params = [
      {
        name: 'userId',
        in: 'path',
        required: true,
      } as ParameterObject,
    ]
    expect(validatePathParameters(params)).toEqual(['userId'])
  })

  it('returns param names for undefined values', () => {
    const params = [createPathParam('userId', undefined)]
    expect(validatePathParameters(params)).toEqual(['userId'])
  })

  it('returns param names for null values', () => {
    const params = [createPathParam('userId', null)]
    expect(validatePathParameters(params)).toEqual(['userId'])
  })

  it('ignores non-path parameters', () => {
    const params = [
      {
        name: 'query',
        in: 'query',
        required: true,
        example: '',
      } as ParameterObject,
    ]
    expect(validatePathParameters(params)).toEqual([])
  })

  it('returns multiple empty param names', () => {
    const params = [createPathParam('orgId', ''), createPathParam('userId', '')]
    expect(validatePathParameters(params)).toEqual(['orgId', 'userId'])
  })

  it('only returns empty params, not filled ones', () => {
    const params = [createPathParam('orgId', 'acme'), createPathParam('userId', '')]
    expect(validatePathParameters(params)).toEqual(['userId'])
  })

  it('returns empty array for empty parameters list', () => {
    expect(validatePathParameters([])).toEqual([])
  })

  it('returns empty array for undefined parameters', () => {
    expect(validatePathParameters(undefined)).toEqual([])
  })

  it('skips disabled path parameters', () => {
    const params = [
      {
        name: 'userId',
        in: 'path',
        required: true,
        example: '',
        examples: {
          default: { value: '', 'x-disabled': true },
        },
      } as unknown as ParameterObject,
    ]
    expect(validatePathParameters(params)).toEqual([])
  })

  it('accepts numeric values', () => {
    const params = [createPathParam('userId', 42)]
    expect(validatePathParameters(params)).toEqual([])
  })

  it('uses the provided exampleKey', () => {
    const params = [
      {
        name: 'userId',
        in: 'path',
        required: true,
        examples: {
          default: { value: '' },
          custom: { value: 'abc' },
        },
      } as unknown as ParameterObject,
    ]
    // default key → empty
    expect(validatePathParameters(params, 'default')).toEqual(['userId'])
    // custom key → has value
    expect(validatePathParameters(params, 'custom')).toEqual([])
  })
})
