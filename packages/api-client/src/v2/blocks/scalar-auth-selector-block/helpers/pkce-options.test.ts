import { describe, expect, expectTypeOf, it } from 'vitest'

import { PKCE_OPTIONS, type PkceOption, isPkceOption } from './pkce-options'

describe('pkce-options', () => {
  describe('PkceOption', () => {
    it('matches the methods the workspace store accepts for x-usePkce', () => {
      // A new method in the workspace store fails this assertion during type checking, which is
      // the reminder to offer it in the dropdown as well.
      expectTypeOf<PkceOption>().toEqualTypeOf<'SHA-256' | 'plain' | 'no'>()
    })
  })

  describe('PKCE_OPTIONS', () => {
    it('lists every method once, in dropdown order', () => {
      expect(PKCE_OPTIONS).toStrictEqual(['SHA-256', 'plain', 'no'])
      expectTypeOf(PKCE_OPTIONS).toEqualTypeOf<readonly PkceOption[]>()
    })
  })

  describe('isPkceOption', () => {
    it.each(PKCE_OPTIONS)('accepts %s', (value) => {
      expect(isPkceOption(value)).toBe(true)
    })

    it.each(['', 'S256', 'sha-256', 'SHA256', 'Plain', 'none', ' no'])('rejects %j', (value) => {
      expect(isPkceOption(value)).toBe(false)
    })

    it.each(['toString', 'constructor', 'hasOwnProperty', '__proto__'])(
      'rejects the inherited object key %s',
      (value) => {
        expect(isPkceOption(value)).toBe(false)
      },
    )

    it('narrows the value to a PKCE method', () => {
      const value: string = 'plain'
      if (isPkceOption(value)) {
        expectTypeOf(value).toEqualTypeOf<PkceOption>()
      }
    })
  })
})
