import { describe, expect, it } from 'vitest'

import { isStreamingContentType } from './is-streaming-content-type'

describe('is-streaming-content-type', () => {
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
