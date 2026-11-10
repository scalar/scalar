import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'

import { useDecimalMultipleOf } from './decimal-multiple-of'

describe('decimal-multiple-of', () => {
  it.each([
    ['12345678901234567000', 1000, true],
    ['12345678901234567000', 10, true],
    ['1e23', 1e22, true],
    ['-1e23', 1e22, true],
    ['1000000000000000128', 2.5, true],
    ['1000000000000000100', 1.5, false],
  ] as const)('checks JSON number %s against %s using decimal semantics', (json, multipleOf, expected) => {
    const ajv = useDecimalMultipleOf(new Ajv())
    expect(ajv.compile({ type: 'number', multipleOf })(JSON.parse(json))).toBe(expected)
  })

  it.each([
    [6, 3, true],
    [-6, 3, true],
    [7, 3, false],
    [0, 3, true],
    [Number.MAX_SAFE_INTEGER, 1, true],
  ] as const)('checks the safe integer %s against %s', (value, multipleOf, expected) => {
    const ajv = useDecimalMultipleOf(new Ajv())
    expect(ajv.compile({ type: 'number', multipleOf })(value)).toBe(expected)
  })

  it('preserves Ajv error metadata and parameter coercion', () => {
    const ajv = useDecimalMultipleOf(new Ajv({ coerceTypes: true }))
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
    const ajv = useDecimalMultipleOf(new Ajv({ validateSchema: false }))
    expect(() => ajv.compile({ type: 'number', multipleOf })).toThrow(
      'multipleOf must be a finite number greater than 0',
    )
  })
})
