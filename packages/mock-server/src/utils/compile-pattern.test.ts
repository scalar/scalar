import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'

import { compilePattern } from './compile-pattern'

describe('compilePattern', () => {
  it.each([
    [String.raw`^\d{5}(\-\d{4})?$`, '12345-6789', '12345-'],
    [String.raw`^[a-z0-9\_]+$`, 'snake_case', 'kebab-case'],
    [String.raw`^\+?[0-9\ ]+$`, '+49 30 1234', '+49-30'],
    [String.raw`^\@[a-z]+$`, '@scalar', 'scalar'],
  ])('compiles %s without the unicode flag when it only parses without it', (pattern, valid, invalid) => {
    const regExp = compilePattern(pattern, 'u')

    expect(regExp.test(valid)).toBe(true)
    expect(regExp.test(invalid)).toBe(false)
  })

  it.each([
    [String.raw`^\p{L}+$`, 'Ünïcödé', 'abc1'],
    ['^.$', '😀', 'ab'],
    [String.raw`^[\w\-\.]+$`, 'a-b.c', 'a b'],
  ])('keeps the unicode flag for %s, which parses with it', (pattern, valid, invalid) => {
    const regExp = compilePattern(pattern, 'u')

    expect(regExp.flags).toBe('u')
    expect(regExp.test(valid)).toBe(true)
    expect(regExp.test(invalid)).toBe(false)
  })

  it('keeps the flags it is given when the unicode flag is off', () => {
    expect(compilePattern(String.raw`^\-$`, '').flags).toBe('')
  })

  it('still throws for a pattern that parses in neither mode', () => {
    expect(() => compilePattern('[z-a]', 'u')).toThrow(SyntaxError)
  })

  describe('with Ajv', () => {
    const compile = (schema: object) =>
      new Ajv2020({ strict: false, allErrors: true, code: { regExp: compilePattern } }).compile(schema)

    it('compiles a schema whose pattern only parses without the unicode flag', () => {
      const validate = compile({ type: 'string', pattern: String.raw`^\d{5}(\-\d{4})?$` })

      expect(validate('12345-6789')).toBe(true)
      expect(validate('1234')).toBe(false)
    })

    it('compiles a patternProperties name that only parses without the unicode flag', () => {
      const validate = compile({
        type: 'object',
        patternProperties: { [String.raw`^x\-`]: { type: 'string' } },
      })

      expect(validate({ 'x-id': 'a' })).toBe(true)
      expect(validate({ 'x-id': 1 })).toBe(false)
    })

    it('keeps unicode property escapes working', () => {
      const validate = compile({ type: 'string', pattern: String.raw`^\p{Lu}` })

      expect(validate('Über')).toBe(true)
      expect(validate('über')).toBe(false)
    })
  })
})
