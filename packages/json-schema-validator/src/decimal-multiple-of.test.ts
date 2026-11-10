import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'

import { decimalMultipleOf } from './decimal-multiple-of'

describe('decimal-multiple-of', () => {
  it('preserves Ajv error metadata and parameter coercion', () => {
    const ajv = new Ajv({ coerceTypes: true }).removeKeyword('multipleOf').addKeyword(decimalMultipleOf)
    const validate = ajv.compile({ type: 'object', properties: { price: { type: 'number', multipleOf: 0.01 } } })

    const price = { price: '19.99' }
    expect(validate(price)).toBe(true)
    expect(price).toStrictEqual({ price: 19.99 })
    expect(validate({ price: '0.010000000001' })).toBe(false)
    expect(validate.errors).toStrictEqual([
      {
        instancePath: '/price',
        schemaPath: '#/properties/price/multipleOf',
        keyword: 'multipleOf',
        params: { multipleOf: 0.01 },
        message: 'must be multiple of 0.01',
      },
    ])
    expect(validate({ price: '1000000.19' })).toBe(true)
    expect(validate.errors).toBeNull()
  })

  it.each([0, -0.01, Number.NaN, Number.POSITIVE_INFINITY])('rejects the invalid divisor %s', (multipleOf) => {
    // Even when callers disable meta-schema validation, a bad divisor must not reach BigInt arithmetic.
    const ajv = new Ajv({ validateSchema: false }).removeKeyword('multipleOf').addKeyword(decimalMultipleOf)
    expect(() => ajv.compile({ type: 'number', multipleOf })).toThrow(
      'multipleOf must be a finite number greater than 0',
    )
  })
})
