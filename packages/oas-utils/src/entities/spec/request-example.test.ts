import { describe, expect, it } from 'vitest'

import { createParamInstance } from './request-examples'

describe('createParamInstance', () => {
  it('works with schema type number', () => {
    const result = createParamInstance({
      in: 'path',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 1,
        type: 'number',
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
      type: 'number',
      default: 1,
    })
  })

  it('works with schema type string', () => {
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
})
