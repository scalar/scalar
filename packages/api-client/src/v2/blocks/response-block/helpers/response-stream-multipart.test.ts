import { describe, expect, it, vi } from 'vitest'

import { createMultipartParser } from './response-stream-multipart'

const encode = (value: string): Uint8Array => new TextEncoder().encode(value)

describe('response-stream-multipart', () => {
  it('parses headers and UTF-8 bodies at every possible byte split', () => {
    const bytes = encode(
      'preamble\r\n--parts\r\nContent-Type: application/json\r\n\r\n{"name":"月"}\r\n--parts--\r\nepilogue',
    )
    for (let split = 0; split <= bytes.length; split++) {
      const output: string[] = []
      const parser = createMultipartParser('multipart/mixed; boundary="parts"', (text) => output.push(text))
      parser.push(bytes.slice(0, split))
      parser.push(bytes.slice(split))
      parser.finish()
      expect(output.join('')).toBe('Part 1\nContent-Type: application/json\n\n{\n  "name": "月"\n}\n')
    }
  })

  it('emits a completed part while the next part is still arriving', () => {
    const output: string[] = []
    const parser = createMultipartParser('multipart/mixed; boundary=x', (text) => output.push(text))
    parser.push(encode('--x\r\n\r\nfirst\r\n--x\r\nContent-Type: text/plain\r\n\r\nsec'))
    expect(output.join('')).toBe('Part 1\n\nfirst\n')
    parser.push(encode('ond\r\n--x--'))
    parser.finish()
    expect(output.join('')).toBe('Part 1\n\nfirst\nPart 2\nContent-Type: text/plain\n\nsecond\n')
  })

  it('ignores boundary-like text that is not a delimiter line', () => {
    const output: string[] = []
    const parser = createMultipartParser('multipart/mixed; boundary=x', (text) => output.push(text))
    parser.push(encode('--x\r\n\r\ninline--x\r\n--xyz\r\n--x--\r\n'))
    parser.finish()
    expect(output.join('')).toBe('Part 1\n\ninline--x\r\n--xyz\n')
  })

  it('retains binary part bytes as base64', () => {
    const output: string[] = []
    const parser = createMultipartParser('multipart/mixed; boundary=x', (text) => output.push(text))
    parser.push(encode('--x\r\nContent-Type: application/octet-stream\r\n\r\n'))
    parser.push(Uint8Array.of(0, 255, 128))
    parser.push(encode('\r\n--x--\r\n'))
    parser.finish()
    expect(output.join('')).toBe(
      'Part 1\nContent-Type: application/octet-stream\n\n[Binary part: 3 bytes, base64]\nAP+A\n',
    )
  })

  it('parses nested multipart bodies', () => {
    const output: string[] = []
    const parser = createMultipartParser('multipart/mixed; boundary=outer', (text) => output.push(text))
    parser.push(
      encode(
        '--outer\r\nContent-Type: multipart/mixed; boundary=inner\r\n\r\n--inner\r\n\r\nhello\r\n--inner--\r\n\r\n--outer--\r\n',
      ),
    )
    parser.finish()
    expect(output.join('')).toBe('Part 1\nContent-Type: multipart/mixed; boundary=inner\n\nPart 1.1\n\nhello\n')
  })

  it('parses delimiters and padded delimiter lines delivered one byte at a time', () => {
    const output: string[] = []
    const parser = createMultipartParser('multipart/mixed; boundary=x', (text) => output.push(text))
    const body = '--x \t\r\n\r\nfirst\r\n--xyz\r\n--x\t \r\n\r\nsecond\r\n--x-- \t\r\n'
    for (const byte of encode(body)) {
      parser.push(Uint8Array.of(byte))
    }
    parser.finish()
    expect(output.join('')).toBe('Part 1\n\nfirst\r\n--xyz\nPart 2\n\nsecond\n')
  })

  it('accepts a nearly 8 MiB part delivered in 1 KiB chunks', () => {
    const output: string[] = []
    const parser = createMultipartParser('multipart/mixed; boundary=x', (text) => output.push(text))
    const chunk = encode('a'.repeat(1024))
    parser.push(encode('--x\r\n\r\n'))
    for (let index = 0; index < 8191; index++) {
      parser.push(chunk)
    }
    parser.push(encode('\r\n--x--\r\n'))
    parser.finish()
    expect(output.join('')).toBe(`Part 1\n\n${'a'.repeat(8191 * 1024)}\n`)
  })

  it('rejects oversized parts without waiting for the closing delimiter', () => {
    const parser = createMultipartParser('multipart/mixed; boundary=x', vi.fn())
    parser.push(encode('--x\r\n\r\n'))
    expect(() => parser.push(new Uint8Array(8 * 1024 * 1024 + 16))).toThrow('8 MiB display limit')
  })

  it.each(Array.from({ length: 10 }, (_, split) => split))(
    'accepts an exactly 8 MiB part with closing delimiter split at byte %s',
    (split) => {
      const limit = 8 * 1024 * 1024
      const closing = encode('\r\n--x--\r\n')
      const output: string[] = []
      const parser = createMultipartParser('multipart/mixed; boundary=x', (text) => output.push(text))
      parser.push(encode(`--x\r\n\r\n${'a'.repeat(limit - 2)}`))
      parser.push(closing.subarray(0, split))
      parser.push(closing.subarray(split))
      parser.finish()
      expect(output.join('')).toBe(`Part 1\n\n${'a'.repeat(limit - 2)}\n`)
    },
  )

  it('rejects a completed part one byte above 8 MiB without emitting it', () => {
    const emit = vi.fn()
    const parser = createMultipartParser('multipart/mixed; boundary=x', emit)
    parser.push(encode(`--x\r\n\r\n${'a'.repeat(8 * 1024 * 1024 - 1)}`))
    expect(() => parser.push(encode('\r\n--x--\r\n'))).toThrow('8 MiB display limit')
    expect(emit).not.toHaveBeenCalled()
  })

  it('reports truncated responses and invalid boundaries', () => {
    const parser = createMultipartParser('multipart/mixed; boundary=x', vi.fn())
    parser.push(encode('--x\r\n\r\nincomplete'))
    expect(parser.finish).toThrow('ended before its closing boundary')
    expect(() => createMultipartParser('multipart/mixed', vi.fn())).toThrow('valid boundary')
  })
})
