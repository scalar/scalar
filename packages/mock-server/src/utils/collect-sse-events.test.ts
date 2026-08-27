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

    it('prefers the singular example over the examples map', () => {
      const events = collectSseEvents(
        {
          example: { from: 'example' },
          examples: { first: { value: { from: 'examples' } } },
        },
        { generate: () => undefined },
      )

      expect(events).toStrictEqual([{ text: '{"from":"example"}', framed: false }])
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

    it('skips examples that carry no value', () => {
      const events = collectSseEvents(
        {
          examples: {
            external: { externalValue: 'https://example.com/events.txt' },
            row: { value: { count: 42 } },
          },
        },
        { generate: () => undefined },
      )

      expect(events).toStrictEqual([{ text: '{"count":42}', framed: false }])
    })

    it('generates from the schema when every example carries no value', () => {
      const events = collectSseEvents(
        { examples: { external: { externalValue: 'https://example.com/events.txt' } } },
        { generate: () => ({ generated: true }) },
      )

      expect(events).toStrictEqual([
        { text: '{"generated":true}', framed: false },
        { text: '{"generated":true}', framed: false },
        { text: '{"generated":true}', framed: false },
      ])
    })

    it('picks the example requested by name', () => {
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

    it('falls back to the schema when the requested example carries no value', () => {
      const events = collectSseEvents(
        { examples: { external: { externalValue: 'https://example.com/events.txt' } } },
        { exampleName: 'external', generate: () => ({ generated: true }) },
      )

      expect(events).toStrictEqual([
        { text: '{"generated":true}', framed: false },
        { text: '{"generated":true}', framed: false },
        { text: '{"generated":true}', framed: false },
      ])
    })

    it('reads an array payload as the sequence of events', () => {
      const events = collectSseEvents({ example: [{ id: 1 }, { id: 2 }] }, { generate: () => undefined })

      expect(events).toStrictEqual([
        { text: '{"id":1}', framed: false },
        { text: '{"id":2}', framed: false },
      ])
    })

    it('reads a schema-generated array of several items as the sequence of events', () => {
      const events = collectSseEvents({}, { generate: () => [{ id: 1 }, { id: 2 }] })

      expect(events).toStrictEqual([
        { text: '{"id":1}', framed: false },
        { text: '{"id":2}', framed: false },
      ])
    })

    it('repeats a schema-generated array that holds a single item', () => {
      const events = collectSseEvents({}, { generate: () => [{ id: 1 }] })

      expect(events).toStrictEqual([
        { text: '{"id":1}', framed: false },
        { text: '{"id":1}', framed: false },
        { text: '{"id":1}', framed: false },
      ])
    })

    it('passes an example that is already SSE framing through untouched', () => {
      const events = collectSseEvents({ example: 'data: {"type":"edit"}\n\n' }, { generate: () => undefined })

      expect(events).toStrictEqual([{ text: 'data: {"type":"edit"}\n\n', framed: true }])
    })

    it('terminates framed text with exactly one blank line', () => {
      expect(collectSseEvents({ example: 'event: ping\ndata: 1' }, { generate: () => undefined })).toStrictEqual([
        { text: 'event: ping\ndata: 1\n\n', framed: true },
      ])
      expect(collectSseEvents({ example: 'data: 1\n' }, { generate: () => undefined })).toStrictEqual([
        { text: 'data: 1\n\n', framed: true },
      ])
      expect(collectSseEvents({ example: 'data: 1\r\n\r\n' }, { generate: () => undefined })).toStrictEqual([
        { text: 'data: 1\r\n\r\n', framed: true },
      ])
    })

    it('does not repeat a schema-generated payload that is already framed', () => {
      const events = collectSseEvents({}, { generate: () => 'data: {"a":1}\n\ndata: [DONE]\n\n' })

      expect(events).toStrictEqual([{ text: 'data: {"a":1}\n\ndata: [DONE]\n\n', framed: true }])
    })

    it('treats prose that merely looks like a field as a data payload', () => {
      // A compliant client ignores a line without a colon, so passing this through verbatim would
      // dispatch nothing at all.
      const events = collectSseEvents({ example: 'user created\nid: 42' }, { generate: () => undefined })

      expect(events).toStrictEqual([{ text: 'user created\nid: 42', framed: false }])
    })

    it('treats framing without a data line as a data payload', () => {
      const events = collectSseEvents({ example: 'id: 42' }, { generate: () => undefined })

      expect(events).toStrictEqual([{ text: 'id: 42', framed: false }])
    })

    it('keeps a plain string example as the data payload', () => {
      const events = collectSseEvents({ example: 'hello' }, { generate: () => undefined })

      expect(events).toStrictEqual([{ text: 'hello', framed: false }])
    })

    it('serializes a null example as JSON', () => {
      expect(collectSseEvents({ example: null }, { generate: () => undefined })).toStrictEqual([
        { text: 'null', framed: false },
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
    })
  })
})
