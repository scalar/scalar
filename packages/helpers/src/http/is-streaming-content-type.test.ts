import { describe, expect, it } from 'vitest'

import { getStreamFormat, isStreamingContentType } from './is-streaming-content-type'

describe('is-streaming-content-type', () => {
  it.each([
    ['Text/Event-Stream; charset=utf-8', 'sse'],
    ['application/jsonl', 'json-lines'],
    ['application/x-ndjson', 'json-lines'],
    ['application/json-lines', 'json-lines'],
    ['application/vnd.example+json-seq', 'json-seq'],
    ['multipart/mixed; boundary=example', 'multipart'],
    ['application/json', undefined],
  ])('classifies %s as %s', (contentType, expected) => {
    expect(getStreamFormat(contentType)).toBe(expected)
  })

  it.each([
    'text/event-stream',
    'Text/Event-Stream; charset=utf-8',
    'application/jsonl',
    'application/x-ndjson',
    'application/json-lines',
    'application/json-seq',
    'application/vnd.example+json-seq; charset=utf-8',
    'multipart/mixed; boundary=example',
    'multipart/x-mixed-replace; boundary=example',
  ])('recognizes %s as streaming', (contentType) => {
    expect(isStreamingContentType(contentType)).toBe(true)
  })

  it.each([
    null,
    undefined,
    '',
    'invalid',
    'application/json',
    'application/problem+json',
    'application/octet-stream',
    'text/event-stream-extra',
    'multipart/form-data',
  ])('keeps %s buffered', (contentType) => {
    expect(isStreamingContentType(contentType)).toBe(false)
  })
})
