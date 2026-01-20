import type { ExampleObject, ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { isParamDisabled } from './is-param-disabled'

describe('isParamDisabled', () => {
  it('returns true when x-disabled is explicitly set to true', () => {
    const param: ParameterObject = {
      name: 'apiKey',
      in: 'query',
      required: true,
      schema: { type: 'string' },
    }
    const example: ExampleObject = {
      'x-disabled': true,
    }

    expect(isParamDisabled(param, example)).toBe(true)
  })

  it('returns false when x-disabled is explicitly set to false', () => {
    const param: ParameterObject = {
      name: 'limit',
      in: 'query',
      required: false,
      schema: { type: 'number' },
    }
    const example: ExampleObject = {
      'x-disabled': false,
    }

    expect(isParamDisabled(param, example)).toBe(false)
  })

  it('returns true for optional non-path parameters when x-disabled is not set', () => {
    const queryParam: ParameterObject = {
      name: 'filter',
      in: 'query',
      required: false,
      schema: { type: 'string' },
    }
    const headerParam: ParameterObject = {
      name: 'X-Custom-Header',
      in: 'header',
      required: false,
      schema: { type: 'string' },
    }
    const cookieParam: ParameterObject = {
      name: 'session',
      in: 'cookie',
      required: false,
      schema: { type: 'string' },
    }
    const example: ExampleObject = {}

    expect(isParamDisabled(queryParam, example)).toBe(true)
    expect(isParamDisabled(headerParam, example)).toBe(true)
    expect(isParamDisabled(cookieParam, example)).toBe(true)
  })

  it('returns false for required parameters and path parameters when x-disabled is not set', () => {
    const requiredQueryParam: ParameterObject = {
      name: 'apiKey',
      in: 'query',
      required: true,
      schema: { type: 'string' },
    }
    const requiredHeaderParam: ParameterObject = {
      name: 'Authorization',
      in: 'header',
      required: true,
      schema: { type: 'string' },
    }
    const optionalPathParam: ParameterObject = {
      name: 'id',
      in: 'path',
      required: false,
      schema: { type: 'string' },
    }
    const requiredPathParam: ParameterObject = {
      name: 'userId',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }
    const example: ExampleObject = {}

    expect(isParamDisabled(requiredQueryParam, example)).toBe(false)
    expect(isParamDisabled(requiredHeaderParam, example)).toBe(false)
    expect(isParamDisabled(optionalPathParam, example)).toBe(false)
    expect(isParamDisabled(requiredPathParam, example)).toBe(false)
  })
})
