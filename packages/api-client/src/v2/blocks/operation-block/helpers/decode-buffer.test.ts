import type { ResponseBodyHandler } from '@scalar/oas-utils/helpers'
import { describe, expect, it } from 'vitest'

import { decodeBuffer } from './decode-buffer'

describe('decode-buffer', () => {
  it('decodes JSON content', async () => {
    const jsonData = JSON.stringify({ key: 'value' })
    const buffer = new TextEncoder().encode(jsonData)
    const result = await decodeBuffer(buffer.buffer, 'application/json')
    expect(result).toEqual(JSON.stringify({ key: 'value' }))
  })

  it('decodes text content', async () => {
    const textData = 'Hello, world!'
    const buffer = new TextEncoder().encode(textData)
    const result = await decodeBuffer(buffer.buffer, 'text/plain')
    expect(result).toBe('Hello, world!')
  })

  it('returns a Blob for binary content', async () => {
    const binaryData = new Uint8Array([1, 2, 3, 4])
    const result = await decodeBuffer(binaryData.buffer, 'application/octet-stream')
    expect(result).toBeInstanceOf(Blob)
    expect((result as Blob).type).toBe('application/octet-stream')
  })

  it('uses the charset parameter for text decoding', async () => {
    const textData = 'こんにちは'
    const buffer = new TextEncoder().encode(textData)
    const result = await decodeBuffer(buffer.buffer, 'text/plain; charset=utf-8')
    expect(result).toBe('こんにちは')
  })

  it('ignores empty charset parameters', async () => {
    const textData = 'Hello, world!'
    const buffer = new TextEncoder().encode(textData)
    const result = await decodeBuffer(buffer.buffer, 'text/plain; charset=')
    expect(result).toBe('Hello, world!')
  })

  it('uses a plugin decoder when provided', async () => {
    const binaryData = new Uint8Array([0x01, 0x02, 0x03])
    const handler: ResponseBodyHandler = {
      mimeTypes: ['application/custom'],
      decode: (buf) => `decoded:${new Uint8Array(buf).join(',')}`,
    }

    const result = await decodeBuffer(binaryData.buffer, 'application/custom', handler)

    expect(result).toBe('decoded:1,2,3')
  })

  it('uses a plugin async decoder', async () => {
    const jsonData = JSON.stringify({ hello: 'world' })
    const buffer = new TextEncoder().encode(jsonData)
    const handler: ResponseBodyHandler = {
      mimeTypes: ['application/custom'],
      decode: (buf) => {
        const text = new TextDecoder().decode(buf)
        return `custom:${text}`
      },
    }

    const result = await decodeBuffer(buffer.buffer, 'application/custom', handler)

    expect(result).toBe(`custom:${jsonData}`)
  })

  it('falls back to default decoding when plugin has no decode', async () => {
    const textData = 'Hello!'
    const buffer = new TextEncoder().encode(textData)
    const handler: ResponseBodyHandler = {
      mimeTypes: ['text/plain'],
    }

    const result = await decodeBuffer(buffer.buffer, 'text/plain', handler)
    expect(result).toBe('Hello!')
  })
})
