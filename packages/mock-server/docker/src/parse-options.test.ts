import { describe, expect, it } from 'vitest'

import { parseOptions } from './parse-options'

describe('parse-options', () => {
  it('validates requests by default', () => {
    expect(parseOptions([], {})).toStrictEqual({ validateRequest: true })
  })

  it('reads the document URL from --url', () => {
    expect(parseOptions(['--url', ' https://example.com/openapi.yaml '], {})).toStrictEqual({
      url: 'https://example.com/openapi.yaml',
      validateRequest: true,
    })
  })

  it('ignores --url without a value', () => {
    expect(parseOptions(['--url'], {})).toStrictEqual({ validateRequest: true })
    expect(parseOptions(['--url', '  '], {})).toStrictEqual({ validateRequest: true })
  })

  it('disables validation with --no-validate-request', () => {
    expect(parseOptions(['--no-validate-request'], {})).toStrictEqual({ validateRequest: false })
  })

  it('disables validation with --no-validate-request in any position', () => {
    expect(parseOptions(['--no-validate-request', '--url', 'https://example.com/openapi.json'], {})).toStrictEqual({
      url: 'https://example.com/openapi.json',
      validateRequest: false,
    })
    expect(parseOptions(['--url', 'https://example.com/openapi.json', '--no-validate-request'], {})).toStrictEqual({
      url: 'https://example.com/openapi.json',
      validateRequest: false,
    })
  })

  it('does not treat a URL value as a flag', () => {
    expect(parseOptions(['--url', '--no-validate-request'], {})).toStrictEqual({
      url: '--no-validate-request',
      validateRequest: true,
    })
  })

  it.each(['false', 'FALSE', ' False ', '0'])('disables validation when VALIDATE_REQUEST is %j', (value) => {
    expect(parseOptions([], { VALIDATE_REQUEST: value })).toStrictEqual({ validateRequest: false })
  })

  it.each(['true', 'TRUE', '1', '', '  '])('keeps validation on when VALIDATE_REQUEST is %j', (value) => {
    expect(parseOptions([], { VALIDATE_REQUEST: value })).toStrictEqual({ validateRequest: true })
  })

  it('lets --no-validate-request win over VALIDATE_REQUEST=true', () => {
    expect(parseOptions(['--no-validate-request'], { VALIDATE_REQUEST: 'true' })).toStrictEqual({
      validateRequest: false,
    })
  })

  it.each(['flase', 'no', 'off', 'disabled'])('rejects an unrecognized VALIDATE_REQUEST value %j', (value) => {
    expect(() => parseOptions([], { VALIDATE_REQUEST: value })).toThrow(
      `VALIDATE_REQUEST must be "true" or "false" (or "1" or "0"), received "${value}"`,
    )
    // The flag does not hide a broken variable.
    expect(() => parseOptions(['--no-validate-request'], { VALIDATE_REQUEST: value })).toThrow('VALIDATE_REQUEST')
  })
})
