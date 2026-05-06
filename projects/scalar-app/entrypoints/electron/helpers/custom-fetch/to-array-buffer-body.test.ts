import { describe, expect, it } from 'vitest'

import { toArrayBufferBody } from './to-array-buffer-body'

describe('to-array-buffer-body', () => {
  it('returns undefined for a null body', async () => {
    expect(await toArrayBufferBody(null)).toBeUndefined()
  })

  it('returns undefined for an undefined body', async () => {
    expect(await toArrayBufferBody(undefined)).toBeUndefined()
  })

  it('treats an empty string as falsy and returns undefined', async () => {
    // The Fetch spec treats "" as a valid body, but we intentionally short-circuit
    // on falsy values to avoid transferring a zero-byte buffer over IPC.
    expect(await toArrayBufferBody('')).toBeUndefined()
  })

  it('passes an ArrayBuffer through without re-wrapping', async () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer as ArrayBuffer
    expect(await toArrayBufferBody(buffer)).toBe(buffer)
  })

  it('converts a string body to ArrayBuffer with the correct content', async () => {
    const result = await toArrayBufferBody('{"key":"value"}')
    expect(result).toBeInstanceOf(ArrayBuffer)
    expect(new TextDecoder().decode(result)).toBe('{"key":"value"}')
  })

  it('converts a Blob body to ArrayBuffer', async () => {
    const blob = new Blob(['hello blob'], { type: 'text/plain' })
    const result = await toArrayBufferBody(blob)
    expect(result).toBeInstanceOf(ArrayBuffer)
  })

  it('converts URLSearchParams body to ArrayBuffer with correct encoding', async () => {
    const params = new URLSearchParams({ foo: 'bar', baz: 'qux' })
    const result = await toArrayBufferBody(params)
    expect(result).toBeInstanceOf(ArrayBuffer)
    expect(new TextDecoder().decode(result)).toBe('foo=bar&baz=qux')
  })

  it('converts a Uint8Array (ArrayBufferView) body to ArrayBuffer', async () => {
    const view = new Uint8Array([10, 20, 30])
    const result = await toArrayBufferBody(view)
    expect(result).toBeInstanceOf(ArrayBuffer)
    expect(new Uint8Array(result!)).toEqual(view)
  })

  it('passes a large binary body without corruption', async () => {
    const size = 1024 * 1024
    const bytes = new Uint8Array(size)
    for (let i = 0; i < size; i++) {
      bytes[i] = i % 256
    }
    const buffer = bytes.buffer as ArrayBuffer
    const result = await toArrayBufferBody(buffer)
    expect(new Uint8Array(result!)).toEqual(bytes)
  })
})
