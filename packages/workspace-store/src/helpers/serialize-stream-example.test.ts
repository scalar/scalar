import { describe, expect, it } from 'vitest'

import { serializeStreamExample } from './serialize-stream-example'

describe('serialize-stream-example', () => {
  it('does not serialize an absent example as an undefined JSON record', () => {
    expect(serializeStreamExample(undefined, 'application/jsonl', true)).toBeUndefined()
  })

  it.each(['application/jsonl', 'application/x-ndjson', 'Application/JSONL; charset=utf-8'])(
    'frames one item for %s',
    (type) => {
      expect(serializeStreamExample({ id: 1 }, type, true)).toBe('{"id":1}\n')
    },
  )

  it('preserves arrays that are individual stream items', () => {
    expect(serializeStreamExample([1, 2], 'application/jsonl', true)).toBe('[1,2]\n')
    expect(serializeStreamExample([1, 2], 'application/jsonl', false)).toBe('1\n2\n')
  })

  it.each(['application/json-seq', 'application/geo+json-seq'])('adds record separators for %s', (type) => {
    expect(serializeStreamExample([false, 0, null], type, false)).toBe('\u001efalse\n\u001e0\n\u001enull\n')
  })

  it('serializes SSE fields and multiline data, ignoring unknown fields', () => {
    expect(
      serializeStreamExample(
        { event: 'update', id: '1', retry: 0, data: 'first\r\nsecond\n', extra: 'ignored' },
        'text/event-stream',
        true,
      ),
    ).toBe('event: update\nid: 1\nretry: 0\ndata: first\ndata: second\ndata: \n\n')
  })

  it('ignores invalid SSE field values', () => {
    expect(serializeStreamExample({ id: 'bad\0id', retry: -1, data: { x: 1 } }, 'text/event-stream', true)).toBe(
      'data: {"x":1}\n\n',
    )
  })

  it('leaves other media types to their existing serializer', () => {
    expect(serializeStreamExample({ id: 1 }, 'application/json', true)).toBeUndefined()
  })
})
