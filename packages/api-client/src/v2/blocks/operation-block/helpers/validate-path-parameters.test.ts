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
  it('returns ok: true when all path params have values', () => {
    const params = [createPathParam('userId', '123')]
    expect(validatePathParameters(params)).toEqual({ ok: true })
  })

  it('returns invalidParams for empty string values', () => {
    const params = [createPathParam('userId', '')]
    expect(validatePathParameters(params)).toEqual({ ok: false, invalidParams: ['userId'] })
  })

  it('returns invalidParams for whitespace-only values', () => {
    const params = [createPathParam('userId', '   ')]
    expect(validatePathParameters(params)).toEqual({ ok: false, invalidParams: ['userId'] })
  })

  it('returns invalidParams when no example exists', () => {
    const params = [
      {
        name: 'userId',
        in: 'path',
        required: true,
      } as ParameterObject,
    ]
    expect(validatePathParameters(params)).toEqual({ ok: false, invalidParams: ['userId'] })
  })

  it('returns invalidParams for undefined values', () => {
    const params = [createPathParam('userId', undefined)]
    expect(validatePathParameters(params)).toEqual({ ok: false, invalidParams: ['userId'] })
  })

  it('returns invalidParams for null values', () => {
    const params = [createPathParam('userId', null)]
    expect(validatePathParameters(params)).toEqual({ ok: false, invalidParams: ['userId'] })
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
    expect(validatePathParameters(params)).toEqual({ ok: true })
  })

  it('returns multiple invalid param names', () => {
    const params = [createPathParam('orgId', ''), createPathParam('userId', '')]
    expect(validatePathParameters(params)).toEqual({
      ok: false,
      invalidParams: ['orgId', 'userId'],
    })
  })

  it('only returns empty params, not filled ones', () => {
    const params = [createPathParam('orgId', 'acme'), createPathParam('userId', '')]
    expect(validatePathParameters(params)).toEqual({ ok: false, invalidParams: ['userId'] })
  })

  it('returns ok: true for empty parameters list', () => {
    expect(validatePathParameters([])).toEqual({ ok: true })
  })

  it('returns ok: true for undefined parameters', () => {
    expect(validatePathParameters(undefined)).toEqual({ ok: true })
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
    expect(validatePathParameters(params)).toEqual({ ok: true })
  })

  it('accepts numeric values', () => {
    const params = [createPathParam('userId', 42)]
    expect(validatePathParameters(params)).toEqual({ ok: true })
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
    expect(validatePathParameters(params, 'default')).toEqual({
      ok: false,
      invalidParams: ['userId'],
    })
    expect(validatePathParameters(params, 'custom')).toEqual({ ok: true })
  })
})
