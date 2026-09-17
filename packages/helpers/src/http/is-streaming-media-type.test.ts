import { describe, expect, it } from 'vitest'

import { getStreamFormat, isStreamingMediaType } from './is-streaming-media-type'

describe('is-streaming-media-type', () => {
  it.each([
    ['application/jsonl', 'json-lines'],
    ['application/x-ndjson', 'json-lines'],
    ['application/json-lines', 'json-lines'],
    ['Application/JSONL; charset=utf-8', 'json-lines'],
    ['application/json-seq', 'json-seq'],
    ['application/geo+json-seq', 'json-seq'],
    ['text/event-stream; charset=utf-8', 'sse'],
  ])('recognizes %s', (contentType, format) => {
    expect(isStreamingMediaType(contentType)).toBe(true)
    expect(getStreamFormat(contentType)).toBe(format)
  })

  it.each(['', 'application/json', 'text/json-seq', 'text/event-streaming', 'multipart/mixed'])(
    'rejects %s',
    (contentType) => {
      expect(isStreamingMediaType(contentType)).toBe(false)
      expect(getStreamFormat(contentType)).toBeUndefined()
    },
  )
})
