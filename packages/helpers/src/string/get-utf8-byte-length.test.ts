import { describe, expect, it } from 'vitest'

import { getUtf8ByteLength } from './get-utf8-byte-length'

describe('get-utf8-byte-length', () => {
  it.each([
    ['', 0],
    ['ASCII', 5],
    ['é', 2],
    ['月', 3],
    ['🌙', 4],
    ['aé月🌙', 10],
    ['\ud800', 3],
    ['\udc00', 3],
    ['\ud800x\udc00', 7],
  ])('counts UTF-8 bytes for %j', (text, expected) => {
    expect(getUtf8ByteLength(text)).toBe(expected)
    expect(getUtf8ByteLength(text)).toBe(new TextEncoder().encode(text).byteLength)
  })
})
