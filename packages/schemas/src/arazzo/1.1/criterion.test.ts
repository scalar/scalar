import { validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { arazzoCriterionObject } from './criterion'

describe('criterion', () => {
  it('validates a bare simple condition with no type', () => {
    expect(validate(arazzoCriterionObject, { condition: '$statusCode == 200' })).toBe(true)
  })

  it('validates a regex condition with a context', () => {
    expect(
      validate(arazzoCriterionObject, {
        context: '$response.header.Content-Type',
        condition: '^application/json',
        type: 'regex',
      }),
    ).toBe(true)
  })

  it('validates a jsonpath condition', () => {
    expect(
      validate(arazzoCriterionObject, {
        context: '$response.body',
        condition: '$.status',
        type: 'jsonpath',
      }),
    ).toBe(true)
  })

  it('validates an xpath condition', () => {
    expect(
      validate(arazzoCriterionObject, {
        context: '$response.body',
        condition: 'count(/root/pets/*) > 0',
        type: 'xpath',
      }),
    ).toBe(true)
  })

  it('validates a condition typed with an Expression Type Object', () => {
    expect(
      validate(arazzoCriterionObject, {
        context: '$response.body',
        condition: '/root/pets',
        type: { type: 'xpath', version: '3.1' },
      }),
    ).toBe(true)
  })

  it('rejects a criterion missing condition', () => {
    expect(validate(arazzoCriterionObject, { context: '$response.body' })).toBe(false)
  })
})
