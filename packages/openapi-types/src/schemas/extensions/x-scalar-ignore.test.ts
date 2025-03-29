import { describe, expect, it } from 'vitest'
import { XScalarIgnoreSchema } from './x-scalar-ignore'

describe('XScalarIgnoreSchema', () => {
  it('allows true', () => {
    const result = XScalarIgnoreSchema.parse({
      'x-scalar-ignore': true,
    })

    expect(result).toEqual({ 'x-scalar-ignore': true })
  })

  it('allows false', () => {
    const result = XScalarIgnoreSchema.parse({
      'x-scalar-ignore': false,
    })

    expect(result).toEqual({ 'x-scalar-ignore': false })
  })

  it('defaults to undefined when empty', () => {
    expect(XScalarIgnoreSchema.parse({})).toEqual({ 'x-scalar-ignore': undefined })
  })
})
