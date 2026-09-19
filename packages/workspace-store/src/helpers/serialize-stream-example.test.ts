import { isStreamingMediaType } from '@scalar/helpers/http/is-streaming-media-type'
import { describe, expect, it, vi } from 'vitest'

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

  it('warns once when every SSE record has no valid fields', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(
        serializeStreamExample([{ unknown: true }, { id: 'bad\0id', retry: -1 }], 'text/event-stream', false),
      ).toBe('')
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'Skipped 2 SSE example item(s) with no valid event, id, retry, or data fields.',
      )
    } finally {
      warn.mockRestore()
    }
  })

  it('keeps valid SSE records while reporting omitted records', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(serializeStreamExample([{}, { data: false }, { data: '' }], 'text/event-stream', false)).toBe(
        'data: false\n\ndata: \n\n',
      )
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'Skipped 1 SSE example item(s) with no valid event, id, retry, or data fields.',
      )
    } finally {
      warn.mockRestore()
    }
  })

  it('accepts an intentionally empty SSE sequence without a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(serializeStreamExample([], 'text/event-stream', false)).toBe('')
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it.each(['application/json', 'text/json-seq'])(
    'leaves unsupported media type %s to its existing serializer',
    (type) => {
      expect(isStreamingMediaType(type)).toBe(false)
      expect(serializeStreamExample({ id: 1 }, type, true)).toBeUndefined()
    },
  )
})
