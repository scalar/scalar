import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarIgnore } from './x-scalar-ignore'

describe('XScalarIgnore', () => {
  it('allows true', () => {
    expect(validate(XScalarIgnore, { 'x-scalar-ignore': true })).toBe(true)
    expect(coerce(XScalarIgnore, { 'x-scalar-ignore': true })).toEqual({ 'x-scalar-ignore': true })
  })

  it('allows false', () => {
    expect(validate(XScalarIgnore, { 'x-scalar-ignore': false })).toBe(true)
    expect(coerce(XScalarIgnore, { 'x-scalar-ignore': false })).toEqual({ 'x-scalar-ignore': false })
  })

  it('allows empty object', () => {
    expect(validate(XScalarIgnore, {})).toBe(true)
    expect(coerce(XScalarIgnore, {})).toEqual({})
  })
})
