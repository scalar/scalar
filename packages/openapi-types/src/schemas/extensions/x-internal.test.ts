import { describe, expect, it } from 'vitest'
import { XInternalSchema } from './x-internal'

describe('XInternalSchema', () => {
  it('allows true', () => {
    const result = XInternalSchema.parse({
      'x-internal': true,
    })

    expect(result).toEqual({ 'x-internal': true })
  })

  it('allows false', () => {
    const result = XInternalSchema.parse({
      'x-internal': false,
    })

    expect(result).toEqual({ 'x-internal': false })
  })

  it('defaults to undefined when empty', () => {
    expect(XInternalSchema.parse({})).toEqual({ 'x-internal': undefined })
  })
})
