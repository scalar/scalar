import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XusePkce } from './x-use-pkce'

describe('XusePkce', () => {
  it('allows SHA-256 value', () => {
    expect(validate(XusePkce, { 'x-usePkce': 'SHA-256' })).toBe(true)
    expect(coerce(XusePkce, { 'x-usePkce': 'SHA-256' })).toEqual({ 'x-usePkce': 'SHA-256' })
  })

  it('allows plain value', () => {
    expect(validate(XusePkce, { 'x-usePkce': 'plain' })).toBe(true)
    expect(coerce(XusePkce, { 'x-usePkce': 'plain' })).toEqual({ 'x-usePkce': 'plain' })
  })

  it('allows no value', () => {
    expect(validate(XusePkce, { 'x-usePkce': 'no' })).toBe(true)
    expect(coerce(XusePkce, { 'x-usePkce': 'no' })).toEqual({ 'x-usePkce': 'no' })
  })

  it('rejects empty object', () => {
    expect(validate(XusePkce, {})).toBe(false)
  })

  it('rejects invalid value', () => {
    expect(validate(XusePkce, { 'x-usePkce': 'invalid' })).toBe(false)
  })

  it('defaults to "no" when empty', () => {
    expect(coerce(XusePkce, {})).toEqual({ 'x-usePkce': 'no' })
  })
})
