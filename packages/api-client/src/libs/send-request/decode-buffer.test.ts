import { describe, expect, it } from 'vitest'

import { decodeBuffer } from './decode-buffer'

describe('decode-buffer', () => {
  it('decodes JSON content', () => {
    const jsonData = JSON.stringify({ key: 'value' })
    const buffer = new TextEncoder().encode(jsonData)
    const result = decodeBuffer(buffer, 'application/json')
    expect(result).toEqual(JSON.stringify({ key: 'value' }))
  })

  it('decodes text content', () => {
    const textData = 'Hello, world!'
    const buffer = new TextEncoder().encode(textData)
    const result = decodeBuffer(buffer, 'text/plain')
    expect(result).toBe('Hello, world!')
  })

  it('returns a Blob for binary content', () => {
    const binaryData = new Uint8Array([1, 2, 3, 4])
    const result = decodeBuffer(binaryData.buffer, 'application/octet-stream')
    expect(result).toBeInstanceOf(Blob)
    expect((result as Blob).type).toBe('application/octet-stream')
  })

  it('uses the charset parameter for text decoding', () => {
    const textData = 'こんにちは'
    const buffer = new TextEncoder().encode(textData)
    const result = decodeBuffer(buffer, 'text/plain; charset=utf-8')
    expect(result).toBe('こんにちは')
  })
})
