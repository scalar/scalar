import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XusePkceSchema } from './x-use-pkce'

describe('XusePkce', () => {
  it('allows SHA-256 value', () => {
    const result = Value.Parse(XusePkceSchema, {
      'x-usePkce': 'SHA-256',
    })
    expect(result).toEqual({ 'x-usePkce': 'SHA-256' })
  })

  it('allows plain value', () => {
    const result = Value.Parse(XusePkceSchema, {
      'x-usePkce': 'plain',
    })
    expect(result).toEqual({ 'x-usePkce': 'plain' })
  })

  it('allows no value', () => {
    const result = Value.Parse(XusePkceSchema, {
      'x-usePkce': 'no',
    })
    expect(result).toEqual({ 'x-usePkce': 'no' })
  })

  it('defaults to "no" when empty', () => {
    const result = Value.Parse(XusePkceSchema, {})
    expect(result).toEqual({ 'x-usePkce': 'no' })
  })

  it('throws error when invalid value provided', () => {
    expect(() =>
      Value.Parse(XusePkceSchema, {
        'x-usePkce': 'invalid',
      }),
    ).toThrow()
  })
})
