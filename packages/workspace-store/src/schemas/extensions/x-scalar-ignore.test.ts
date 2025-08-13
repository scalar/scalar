import { describe, expect, it } from 'vitest'
import { XScalarIgnoreSchema } from './x-scalar-ignore'
import { Value } from '@sinclair/typebox/value'

describe('XScalarIgnoreSchema', () => {
  it('allows true', () => {
    const result = Value.Parse(XScalarIgnoreSchema, {
      'x-scalar-ignore': true,
    })

    expect(result).toEqual({ 'x-scalar-ignore': true })
  })

  it('allows false', () => {
    const result = Value.Parse(XScalarIgnoreSchema, {
      'x-scalar-ignore': false,
    })

    expect(result).toEqual({ 'x-scalar-ignore': false })
  })

  it('defaults to false when empty', () => {
    expect(Value.Parse(XScalarIgnoreSchema, {})).toEqual({ 'x-scalar-ignore': false })
  })
})
