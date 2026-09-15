import { describe, expect, it } from 'vitest'

import { createResponseStreamParser, getResponseStreamFormat } from './response-stream'

const encode = (value: string): Uint8Array => new TextEncoder().encode(value)

const parseChunks = (type: string, chunks: Uint8Array[]): string => {
  const output: string[] = []
  const parser = createResponseStreamParser(type, (text) => output.push(text))
  chunks.forEach(parser.push)
  parser.finish()
  return output.join('')
}

describe('response-stream', () => {
  it.each([
    ['Text/Event-Stream; charset=utf-8', 'text'],
    ['application/jsonl', 'json-lines'],
    ['application/x-ndjson', 'json-lines'],
    ['application/json-lines', 'json-lines'],
    ['application/json-seq', 'json-seq'],
    ['application/geo+json-seq', 'json-seq'],
    ['multipart/mixed; boundary=parts', 'multipart'],
    ['application/json', undefined],
    ['text/json-seq', undefined],
  ])('recognizes %s', (type, expected) => {
    expect(getResponseStreamFormat(type)).toBe(expected)
  })

  it('emits complete JSON Lines records before EOF and holds partial records', () => {
    const output: string[] = []
    const parser = createResponseStreamParser('application/jsonl', (text) => output.push(text))
    parser.push(encode('false\n{"id":'))
    expect(output).toStrictEqual(['false\n'])
    parser.push(encode('1}\r\n0'))
    expect(output).toStrictEqual(['false\n', '{\n  "id": 1\n}\n'])
    parser.finish()
    expect(output).toStrictEqual(['false\n', '{\n  "id": 1\n}\n', '0\n'])
  })

  it('preserves UTF-8 at every possible byte split', () => {
    const bytes = encode('{"name":"月🌙"}\nnull\n')
    for (let split = 0; split <= bytes.length; split++) {
      expect(parseChunks('application/jsonl', [bytes.slice(0, split), bytes.slice(split)])).toBe(
        '{\n  "name": "月🌙"\n}\nnull\n',
      )
    }
  })

  it('reports malformed JSON Lines records and continues with subsequent records', () => {
    expect(parseChunks('application/jsonl', [encode('\n{broken}\ntrue\n')])).toBe(
      '[Invalid JSON record]\n{broken}\ntrue\n',
    )
  })

  it('parses multiline JSON sequences and emits on their terminating newline', () => {
    const output: string[] = []
    const parser = createResponseStreamParser('application/json-seq', (text) => output.push(text))
    for (const byte of encode('\x1e{\n"name":"Moon"\n}\n\x1efalse\n')) {
      parser.push(Uint8Array.of(byte))
    }
    expect(output).toStrictEqual(['{\n  "name": "Moon"\n}\n', 'false\n'])
    parser.finish()
    expect(output.length).toBe(2)
  })

  it('accepts leading newlines inside JSON sequence records across byte splits', () => {
    const bytes = encode('\x1e\n {"ok":true}\n\x1e\r\nfalse\n')
    for (let split = 0; split <= bytes.length; split++) {
      expect(parseChunks('application/json-seq', [bytes.slice(0, split), bytes.slice(split)])).toBe(
        '{\n  "ok": true\n}\nfalse\n',
      )
    }
  })

  it('recovers at a record separator and rejects truncated primitives', () => {
    expect(parseChunks('application/json-seq', [encode('\x1e{broken\x1e123\x1enull\x1e0\n')])).toBe(
      '[Invalid JSON record]\n{broken\n[Invalid JSON record]\n123\n[Invalid JSON record]\nnull\n0\n',
    )
  })

  it('rejects a JSON sequence without record separators', () => {
    expect(() => parseChunks('application/json-seq', [encode('1\n')])).toThrow('missing its record separator')
  })

  it('keeps SSE text unchanged across byte boundaries', () => {
    const bytes = encode('data: 月\n\n')
    expect(
      parseChunks(
        'text/event-stream',
        [...bytes].map((byte) => Uint8Array.of(byte)),
      ),
    ).toBe('data: 月\n\n')
  })

  it.each(['application/jsonl', 'application/json-seq'])('bounds unfinished %s records in UTF-8 bytes', (type) => {
    const parser = createResponseStreamParser(type, () => {})
    const prefix = type === 'application/json-seq' ? '\x1e"' : '"'
    const bytes = encode(`${prefix}${'月'.repeat(2_796_202)}`)
    parser.push(bytes)
    expect(() => parser.push(encode('月'))).toThrow('8 MiB display limit')
  })

  it('rejects invalid UTF-8 JSON instead of silently changing its data', () => {
    expect(() => parseChunks('application/jsonl', [Uint8Array.of(0xff)])).toThrow()
  })
})
