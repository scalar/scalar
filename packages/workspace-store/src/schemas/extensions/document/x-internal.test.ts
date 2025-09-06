import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XInternalSchema } from './x-internal'

describe('XInternalSchema', () => {
  it('allows true', () => {
    const result = Value.Parse(XInternalSchema, {
      'x-internal': true,
    })

    expect(result).toEqual({ 'x-internal': true })
  })

  it('allows false', () => {
    const result = Value.Parse(XInternalSchema, {
      'x-internal': false,
    })

    expect(result).toEqual({ 'x-internal': false })
  })

  it('defaults to undefined when empty', () => {
    expect(Value.Parse(XInternalSchema, {})).toEqual({ 'x-internal': undefined })
  })
})
