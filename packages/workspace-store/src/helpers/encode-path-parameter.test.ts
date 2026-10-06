import { describe, expect, it } from 'vitest'

import { assertReservedPathUrl, encodePathParameter, serializeReservedPathParameter } from './encode-path-parameter'

describe('encode-path-parameter', () => {
  it.each(['%2e', '%2e%2E', '.%2e', '%2e.', '.', '..'])('rejects the browser-normalized dot segment %s', (value) => {
    expect(() => assertReservedPathUrl(`https://example.com/items/${value}/next`)).toThrow(URIError)
  })

  it('preserves encoded dots inside ordinary segments and query values', () => {
    expect(() => assertReservedPathUrl('https://example.com/items/id-%2e%2e?value=/%2e%2e')).not.toThrow()
  })

  it('preserves path-safe reserved characters and escapes forbidden delimiters', () => {
    expect(encodePathParameter(":@!$&'()*+,;=/;?#[]", true)).toBe(":@!$&'()*+,;=%2F;%3F%23%5B%5D")
  })

  it('preserves percent-encoded triples but encodes stray percent signs', () => {
    expect(encodePathParameter('%2f%3F%23%20%GG%', true)).toBe('%2f%3F%23%20%25GG%25')
    expect(encodePathParameter('%2f')).toBe('%252f')
  })

  it('encodes whitespace and Unicode with reserved expansion', () => {
    expect(encodePathParameter('é 😀\n\t', true)).toBe('%C3%A9%20%F0%9F%98%80%0A%09')
  })

  it('retains ordinary encoding when reserved expansion is disabled', () => {
    expect(encodePathParameter('a:b@c/z?#')).toBe('a%3Ab%40c%2Fz%3F%23')
  })

  it('rejects invalid Unicode instead of silently corrupting a value', () => {
    expect(() => encodePathParameter('\ud800', true)).toThrow(URIError)
  })

  it('encodes environment values before adding style delimiters', () => {
    expect(
      serializeReservedPathParameter(
        'id',
        {
          value: ['{{id}}', 'c/d'],
          style: 'matrix',
          explode: true,
        },
        (value) => value.replace('{{id}}', 'a?b'),
      ),
    ).toBe(';id=a%3Fb;id=c%2Fd')
  })
})
