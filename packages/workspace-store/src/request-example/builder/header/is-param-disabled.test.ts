import type {
  ExampleObject,
  ParameterObject,
  ParameterWithSchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getExample } from '../helpers/get-example'
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

  it('returns false for optional non-path params when defaultDisabled is false', () => {
    const param: ParameterObject = {
      name: 'x-scenario-id',
      in: 'header',
      required: false,
      schema: { type: 'string' },
    }

    expect(isParamDisabled(param, {}, false)).toBe(false)
  })

  it('x-disabled: false overrides defaultDisabled: true for optional header params', () => {
    const param: ParameterObject = {
      name: 'x-scenario-id',
      in: 'header',
      required: false,
      schema: { type: 'string' },
    }
    const example: ExampleObject = { 'x-disabled': false }

    expect(isParamDisabled(param, example, true)).toBe(false)
  })

  it('x-disabled: true overrides defaultDisabled: false', () => {
    const param: ParameterObject = {
      name: 'x-scenario-id',
      in: 'header',
      required: false,
      schema: { type: 'string' },
    }
    const example: ExampleObject = { 'x-disabled': true }

    expect(isParamDisabled(param, example, false)).toBe(true)
  })

  it('returns false when example is undefined and defaultDisabled is false', () => {
    const param: ParameterObject = {
      name: 'filter',
      in: 'query',
      required: false,
      schema: { type: 'string' },
    }

    expect(isParamDisabled(param, undefined, false)).toBe(false)
  })
  it.each(['query', 'header', 'cookie'] as const)('uses populated values for optional %s parameters', (location) => {
    const parameter: ParameterObject = { name: 'value', in: location, schema: { type: 'string' } }

    for (const value of ['scenario', 0, false]) {
      expect(isParamDisabled(parameter, { value })).toBe(false)
      expect(isParamDisabled(parameter, { value, 'x-disabled': true })).toBe(true)
    }
    for (const value of [undefined, null, '']) {
      expect(isParamDisabled(parameter, { value })).toBe(true)
      expect(isParamDisabled(parameter, { value, 'x-disabled': false })).toBe(false)
    }
  })
  it.each(['query', 'header', 'cookie'] as const)('keeps optional %s enum suggestions disabled', (location) => {
    const parameter: ParameterObject = {
      name: 'filter',
      in: location,
      schema: { type: 'string', enum: ['None', 'Image'] },
    }
    const example = getExample(parameter, 'default', undefined)
    expect(example).toStrictEqual({ value: 'None' })
    expect(isParamDisabled(parameter, example)).toBe(true)
    expect(isParamDisabled({ ...parameter, required: true }, example)).toBe(false)
    expect(isParamDisabled(parameter, example, false)).toBe(false)
    for (const disabled of [true, false]) {
      const edited = { ...parameter, examples: { default: { value: 'None', 'x-disabled': disabled } } }
      expect(isParamDisabled(edited, getExample(edited, 'default', undefined))).toBe(disabled)
    }
  })

  it.each<ParameterWithSchemaObject['schema']>([
    { type: 'integer', enum: [0, 1] },
    { type: 'number', enum: [1.5, 2.5] },
    { type: 'boolean', enum: [false, true] },
    { type: 'array', items: { type: 'string' }, enum: [['a', 'b']] },
    { type: 'object', properties: { status: { type: 'string', enum: ['None', 'Active'] } } },
    {
      type: 'object',
      properties: { filter: { type: 'object', properties: { status: { type: 'string', enum: ['None', 'Active'] } } } },
    },
    { '$ref': '#/components/schemas/Filter', '$ref-value': { type: 'string', enum: ['None', 'Active'] } },
  ])('keeps generated schema values disabled: %j', (schema) => {
    const parameter: ParameterObject = { name: 'filter', in: 'query', schema }
    expect(isParamDisabled(parameter, getExample(parameter, 'default', undefined))).toBe(true)
  })

  it.each<ParameterWithSchemaObject['schema']>([
    { type: 'integer', enum: [1, 0], default: 0 },
    { type: 'boolean', enum: [true, false], example: false },
    { type: 'string', enum: ['None', 'Image'], examples: ['Image'] },
    {
      type: 'object',
      properties: { status: { type: 'string', enum: ['None', 'Active'] }, count: { type: 'integer', default: 0 } },
    },
  ])('enables authored schema values beside enums: %j', (schema) => {
    const parameter: ParameterObject = { name: 'filter', in: 'query', schema }
    expect(isParamDisabled(parameter, getExample(parameter, 'default', undefined))).toBe(false)
  })
})
