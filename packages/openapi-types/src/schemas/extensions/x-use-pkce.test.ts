import { describe, expect, it } from 'vitest'
import { XusePkceSchema } from './x-use-pkce'

describe('XusePkce', () => {
  it('allows SHA-256 value', () => {
    const result = XusePkceSchema.parse({
      'x-usePkce': 'SHA-256',
    })
    expect(result).toEqual({ 'x-usePkce': 'SHA-256' })
  })

  it('allows plain value', () => {
    const result = XusePkceSchema.parse({
      'x-usePkce': 'plain',
    })
    expect(result).toEqual({ 'x-usePkce': 'plain' })
  })

  it('allows no value', () => {
    const result = XusePkceSchema.parse({
      'x-usePkce': 'no',
    })
    expect(result).toEqual({ 'x-usePkce': 'no' })
  })

  it('defaults to "no" when empty', () => {
    const result = XusePkceSchema.parse({})
    expect(result).toEqual({ 'x-usePkce': 'no' })
  })

  it('throws error when invalid value provided', () => {
    expect(() =>
      XusePkceSchema.parse({
        'x-usePkce': 'invalid',
      }),
    ).toThrow()
  })
})
