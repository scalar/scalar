import { describe, expect, it } from 'vitest'

import { getStreamingResponse } from './streaming-response'

describe('streaming-response', () => {
  it.each(['application/jsonl', 'application/x-ndjson', 'Application/JSONL; charset=utf-8'])(
    'generates three records for %s',
    (contentType) => {
      expect(getStreamingResponse({ itemSchema: { type: 'integer', const: 42 } }, contentType)).toStrictEqual({
        body: [42, 42, 42],
        chunks: ['42\n', '42\n', '42\n'],
        contentType,
      })
    },
  )

  it.each(['application/json-seq', 'application/geo+json-seq'])('frames JSON sequences for %s', (contentType) => {
    expect(
      getStreamingResponse({ itemSchema: {}, example: [0, false, null, 'text'] }, contentType)?.chunks,
    ).toStrictEqual(['\u001e0\n', '\u001efalse\n', '\u001enull\n', '\u001e"text"\n'])
  })

  it('keeps an array-valued item as one JSON record', () => {
    expect(
      getStreamingResponse(
        { itemSchema: { type: 'array', items: { type: 'integer' }, example: [1, 2] } },
        'application/jsonl',
      )?.chunks,
    ).toStrictEqual(['[1,2]\n', '[1,2]\n', '[1,2]\n'])
  })

  it('uses complete-body constraints when both schema fields are present', () => {
    expect(
      getStreamingResponse(
        { schema: { type: 'array', minItems: 1, maxItems: 1 }, itemSchema: { type: 'integer', const: 7 } },
        'application/jsonl',
      )?.chunks,
    ).toStrictEqual(['7\n'])
  })

  it('preserves explicitly serialized examples', () => {
    const value = 'data: [DONE]\n\n'
    expect(getStreamingResponse({ itemSchema: {}, example: value }, 'text/event-stream')?.chunks).toStrictEqual([value])
  })

  it('honors named examples and handler overrides before generating items', () => {
    const mediaType = {
      itemSchema: { type: 'integer' as const },
      examples: { first: { value: '1\n' }, second: { value: '2\n' } },
    }
    expect(getStreamingResponse(mediaType, 'application/jsonl', { exampleName: 'second' })?.chunks).toStrictEqual([
      '2\n',
    ])
    expect(
      getStreamingResponse(mediaType, 'application/jsonl', { body: [3], exampleName: 'second' })?.chunks,
    ).toStrictEqual(['3\n'])
  })

  it('serializes SSE fields instead of wrapping the event object as data', () => {
    expect(
      getStreamingResponse(
        { itemSchema: {}, example: [{ event: 'update', id: '42', retry: 0, data: 'a\r\nb\n', ignored: 'x' }] },
        'text/event-stream',
      )?.chunks,
    ).toStrictEqual(['event: update\nid: 42\nretry: 0\ndata: a\ndata: b\ndata: \n\n'])
  })

  it('ignores invalid SSE fields without injecting new fields', () => {
    expect(
      getStreamingResponse(
        { itemSchema: {}, example: [{ event: 'hello\ndata: bad', id: 'a\0b', retry: -1, data: 'safe' }] },
        'text/event-stream',
      )?.chunks,
    ).toStrictEqual(['data: safe\n\n'])
  })

  it('does not generate items for a false schema', () => {
    expect(getStreamingResponse({ itemSchema: false }, 'application/jsonl')?.chunks).toStrictEqual([])
  })

  it('leaves legacy and unsupported media types on their existing response paths', () => {
    expect(getStreamingResponse({ schema: { type: 'string' } }, 'text/event-stream')).toBeUndefined()
    expect(getStreamingResponse({ itemSchema: {} }, 'multipart/mixed')).toBeUndefined()
  })
})
