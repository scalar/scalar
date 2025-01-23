import { describe, expect, it } from 'vitest'

import { createParamInstance } from './request-examples'

describe('createParamInstance', () => {
  it('works with schema enum type number', () => {
    const result = createParamInstance({
      in: 'path',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 1.2,
        type: 'number',
        enum: [1.2, 2.1, 3],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '1.2',
      enabled: true,
      description: undefined,
      required: true,
      enum: ['1.2', '2.1', '3'],
      type: 'number',
      default: 1.2,
    })
  })

  it('works with schema enum type string', () => {
    const result = createParamInstance({
      in: 'path',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 'foo',
        type: 'string',
        enum: ['foo', 'bar'],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: 'foo',
      enabled: true,
      description: undefined,
      required: true,
      enum: ['foo', 'bar'],
      type: 'string',
      default: 'foo',
    })
  })

  it('works with schema enum type integer', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 1,
        type: 'integer',
        enum: [1, 2, 3],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '1',
      enabled: true,
      description: undefined,
      required: true,
      enum: ['1', '2', '3'],
      type: 'integer',
      default: 1,
    })
  })

  it('works with schema enum type boolean', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: false,
        type: 'boolean',
        enum: [true, false],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: 'false',
      enabled: true,
      description: undefined,
      required: true,
      enum: ['true', 'false'],
      type: 'boolean',
      default: false,
    })
  })

  it('works with schema examples type number', () => {
    const result = createParamInstance({
      in: 'path',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 1.2,
        type: 'number',
        examples: [1.2, 2.1, 3],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '1.2',
      enabled: true,
      description: undefined,
      required: true,
      examples: ['1.2', '2.1', '3'],
      type: 'number',
      default: 1.2,
    })
  })

  it('works with schema examples type string', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: false,
        type: 'boolean',
        examples: ['foo', 'bar'],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: 'false',
      enabled: true,
      description: undefined,
      required: true,
      type: 'boolean',
      default: false,
      examples: ['foo', 'bar'],
    })
  })

  it('works with schema examples type integer', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 1,
        type: 'integer',
        examples: [1, 2, 3],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '1',
      enabled: true,
      description: undefined,
      required: true,
      examples: ['1', '2', '3'],
      type: 'integer',
      default: 1,
    })
  })

  it('works with schema examples type boolean', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: false,
        type: 'boolean',
        examples: [true, false],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: 'false',
      enabled: true,
      description: undefined,
      required: true,
      examples: ['true', 'false'],
      type: 'boolean',
      default: false,
    })
  })
})
