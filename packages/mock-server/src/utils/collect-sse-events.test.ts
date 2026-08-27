import { describe, expect, it, vi } from 'vitest'

import { collectSseEvents, isEventStreamContentType } from './collect-sse-events'

describe('collect-sse-events', () => {
  describe('collectSseEvents', () => {
    it('repeats a schema-generated payload so the stream has more than one event', () => {
      const events = collectSseEvents({}, { generate: () => ({ type: 'edit' }) })

      expect(events).toStrictEqual([
        { text: '{"type":"edit"}', framed: false },
        { text: '{"type":"edit"}', framed: false },
        { text: '{"type":"edit"}', framed: false },
      ])
    })

    it('returns no events when neither an example nor a schema is defined', () => {
      expect(collectSseEvents({}, { generate: () => undefined })).toStrictEqual([])
    })

    it('does not generate from the schema when an example is defined', () => {
      const generate = vi.fn(() => ({ generated: true }))

      const events = collectSseEvents({ example: { from: 'example' } }, { generate })

      expect(events).toStrictEqual([{ text: '{"from":"example"}', framed: false }])
      expect(generate).not.toHaveBeenCalled()
    })

    it('emits one event per named example, in declaration order', () => {
      const events = collectSseEvents(
        {
          examples: {
            summary: { value: { total_rows: 2 } },
            row: { value: { count: 42 } },
          },
        },
        { generate: () => undefined },
      )

      expect(events).toStrictEqual([
        { text: '{"total_rows":2}', framed: false },
        { text: '{"count":42}', framed: false },
      ])
    })

    it('pins the stream to a single event for Prefer: example=<name>', () => {
      const events = collectSseEvents(
        {
          examples: {
            summary: { value: { total_rows: 2 } },
            row: { value: { count: 42 } },
          },
        },
        { exampleName: 'row', generate: () => undefined },
      )

      expect(events).toStrictEqual([{ text: '{"count":42}', framed: false }])
    })

    it('falls back to every example when the requested example name is unknown', () => {
      const events = collectSseEvents(
        { examples: { row: { value: { count: 42 } } } },
        { exampleName: 'nope', generate: () => undefined },
      )

      expect(events).toStrictEqual([{ text: '{"count":42}', framed: false }])
    })

    it('reads an array payload as the sequence of events', () => {
      const events = collectSseEvents({ example: [{ id: 1 }, { id: 2 }] }, { generate: () => undefined })

      expect(events).toStrictEqual([
        { text: '{"id":1}', framed: false },
        { text: '{"id":2}', framed: false },
      ])
    })

    it('reads a schema-generated array as the sequence of events instead of repeating it', () => {
      const events = collectSseEvents({}, { generate: () => [{ id: 1 }, { id: 2 }] })

      expect(events).toStrictEqual([
        { text: '{"id":1}', framed: false },
        { text: '{"id":2}', framed: false },
      ])
    })

    it('passes an example that is already SSE framing through untouched', () => {
      const events = collectSseEvents({ example: 'data: {"type":"edit"}\n\n' }, { generate: () => undefined })

      expect(events).toStrictEqual([{ text: 'data: {"type":"edit"}\n\n', framed: true }])
    })

    it('terminates framed text that is missing its blank line', () => {
      const events = collectSseEvents({ example: 'event: ping\ndata: 1' }, { generate: () => undefined })

      expect(events).toStrictEqual([{ text: 'event: ping\ndata: 1\n\n', framed: true }])
    })

    it('keeps a plain string example as the data payload', () => {
      const events = collectSseEvents({ example: 'hello' }, { generate: () => undefined })

      expect(events).toStrictEqual([{ text: 'hello', framed: false }])
    })

    it('serializes primitive payloads as JSON', () => {
      expect(collectSseEvents({ example: null }, { generate: () => undefined })).toStrictEqual([
        { text: 'null', framed: false },
      ])
      expect(collectSseEvents({ example: [1, true] }, { generate: () => undefined })).toStrictEqual([
        { text: '1', framed: false },
        { text: 'true', framed: false },
      ])
    })

    it('handles a missing media type object', () => {
      expect(collectSseEvents(undefined, { generate: () => undefined })).toStrictEqual([])
    })
  })

  describe('isEventStreamContentType', () => {
    it('matches text/event-stream with and without parameters', () => {
      expect(isEventStreamContentType('text/event-stream')).toBe(true)
      expect(isEventStreamContentType('text/event-stream; charset=utf-8')).toBe(true)
      expect(isEventStreamContentType('TEXT/EVENT-STREAM')).toBe(true)
    })

    it('does not match other content types', () => {
      expect(isEventStreamContentType('application/json')).toBe(false)
      expect(isEventStreamContentType('text/plain')).toBe(false)
      expect(isEventStreamContentType(undefined)).toBe(false)
      expect(isEventStreamContentType(null)).toBe(false)
    })
  })
})
