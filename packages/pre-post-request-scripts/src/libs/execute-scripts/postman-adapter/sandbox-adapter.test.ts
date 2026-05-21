import { describe, expect, it } from 'vitest'

import { toPostmanResponse } from './sandbox-adapter'

describe('sandbox-adapter', () => {
  it('serializes a Response into a Postman response definition with header objects', async () => {
    const response = new Response('{"ok":true}', {
      status: 201,
      statusText: 'Created',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-123',
      },
    })

    const result = await toPostmanResponse(response)

    expect(result.code).toBe(201)
    expect(result.status).toBe('Created')
    expect(result.header).toEqual(
      expect.arrayContaining([
        { key: 'content-type', value: 'application/json' },
        { key: 'x-request-id', value: 'req-123' },
      ]),
    )
    expect(result.stream).toEqual({ type: 'Buffer', data: Array.from(new TextEncoder().encode('{"ok":true}')) })
  })

  it('falls back to the numeric status when statusText is empty', async () => {
    const result = await toPostmanResponse(new Response(null, { status: 204 }))
    expect(result.status).toBe('204')
  })

  it('rejects when the response body cannot be read', async () => {
    const response = new Response('payload', { status: 200 })
    response.arrayBuffer = () => Promise.reject(new Error('Body already used'))

    await expect(toPostmanResponse(response)).rejects.toThrow('Body already used')
  })

  it('preserves binary payloads byte-for-byte', async () => {
    // PDF magic bytes (0x25 0x50 0x44 0x46 … “%PDF”) followed by a byte sequence that is not
    // valid UTF-8 (0xC0 is never a valid lead byte). Round-tripping through `response.text()` +
    // `TextEncoder` would replace 0xC0 with the U+FFFD replacement character and corrupt the
    // signature; `arrayBuffer()` must keep every byte intact.
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0xc0, 0x80, 0xff, 0x00])
    const response = new Response(bytes, { status: 200 })

    const result = await toPostmanResponse(response)

    expect(result.stream).toEqual({ type: 'Buffer', data: Array.from(bytes) })
  })
})
