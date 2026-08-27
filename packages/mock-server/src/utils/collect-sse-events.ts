import { parseMimeType } from '@scalar/helpers/http/mime-type'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/**
 * How many events a schema-generated `text/event-stream` response emits.
 *
 * A single event barely exercises a client's read loop, and an endless stream would never let a
 * request finish, so the mock sends a short, finite burst and closes.
 */
const GENERATED_EVENT_COUNT = 3

/** The field prefixes an SSE line may start with (`data`, `event`, `id`, `retry`). */
const SSE_FIELD = /^(?:data|event|id|retry):/

/** One event of a mocked Server-Sent Events response. */
type SseEvent = {
  /** Already-framed event text when `framed` is true, otherwise the `data` payload of one event. */
  text: string
  /** Whether `text` is SSE framing of its own, to be written as is rather than wrapped in a `data:` line. */
  framed: boolean
}

/**
 * Whether text is already Server-Sent Events framing, so it goes to the wire as its own framing.
 *
 * Some documents spell the wire format out in their example (`data: {"type":"edit"}`) instead of
 * describing a single event payload. Wrapping that in another `data:` line would hand the client the
 * framing as its payload, so it is written as is, with only its terminating blank line normalized.
 *
 * The test is deliberately narrow: real framing starts with a field on its first line and carries at
 * least one `data:` line. Prose that merely happens to contain a colon (`user created\nid: 42`) is
 * not framing — passing it through would make a compliant client dispatch nothing at all.
 */
const isFramed = (text: string): boolean => {
  const lines = text.split(/\r\n|\r|\n/)
  const firstLine = lines.find((line) => line.trim() !== '')

  return firstLine !== undefined && SSE_FIELD.test(firstLine) && lines.some((line) => line.startsWith('data:'))
}

/**
 * Closes framed text with the blank line that ends an SSE event.
 *
 * Documents terminate their framing inconsistently — a YAML block scalar drops all but one newline,
 * and a Windows-authored document uses CRLF — so the tail is normalized to exactly one blank line in
 * the document's own line ending instead of being appended to blindly.
 */
const terminate = (text: string): string => {
  const lineEnding = text.includes('\r\n') ? '\r\n' : '\n'

  return `${text.replace(/[\r\n]+$/, '')}${lineEnding}${lineEnding}`
}

/** Turns one payload into an event, serializing anything that is not already text. */
const toEvent = (payload: unknown): SseEvent => {
  if (typeof payload !== 'string') {
    // `undefined` has no JSON representation, so fall back to `null` rather than an empty event.
    return { text: JSON.stringify(payload) ?? 'null', framed: false }
  }

  return isFramed(payload) ? { text: terminate(payload), framed: true } : { text: payload, framed: false }
}

/**
 * Expands one payload into the events it stands for. An array is read as the sequence of events the
 * endpoint emits, not as a single event carrying a JSON array — that is the shape a stream describes.
 */
const expand = (payload: unknown): SseEvent[] => (Array.isArray(payload) ? payload.map(toEvent) : [toEvent(payload)])

/**
 * The events a `text/event-stream` response emits, in order.
 *
 * Examples win over the schema, mirroring `selectResponseExample`, but a stream reads them as a
 * sequence rather than a single body:
 * 1. A named example requested via `Prefer: example=<name>`.
 * 2. The singular `example` keyword.
 * 3. Every entry of the `examples` map, in declaration order — an event stream that documents a
 *    `summary` and a `row` example is documenting the two events it sends.
 * 4. Nothing declared: a schema-generated payload, repeated so the stream has more than one event.
 *
 * `generate` is a callback so the schema is only turned into an example when no example is declared.
 */
export const collectSseEvents = (
  mediaType: OpenAPIV3_1.MediaTypeObject | undefined,
  { exampleName, generate }: { exampleName?: string; generate: () => unknown },
): SseEvent[] => {
  const { example, examples } = mediaType ?? {}

  if (exampleName && examples && exampleName in examples) {
    const value = getResolvedRef(examples[exampleName])?.value

    if (value !== undefined) {
      return expand(value)
    }
  }

  if (example !== undefined) {
    return expand(example)
  }

  if (examples) {
    // An Example Object that only carries an `externalValue` has no value to send, so it is skipped
    // rather than turned into a `data: null` event.
    const values = Object.values(examples)
      .map((entry) => getResolvedRef(entry)?.value)
      .filter((value) => value !== undefined)

    if (values.length > 0) {
      return values.flatMap(expand)
    }
  }

  const generated = generate()

  // Without a schema there is nothing to send, so the stream opens and closes without an event.
  if (generated === undefined) {
    return []
  }

  const events = expand(generated)
  const [firstEvent] = events

  // Only a lone generated payload is repeated. Framing generated from the schema already spells the
  // whole stream out (repeating it would replay a terminal event such as `[DONE]`), and a generated
  // sequence of several events is a sequence already.
  return events.length === 1 && firstEvent && !firstEvent.framed
    ? Array.from({ length: GENERATED_EVENT_COUNT }, () => firstEvent)
    : events
}

/** Whether a media type is Server-Sent Events, ignoring parameters such as `; charset=utf-8`. */
export const isEventStreamContentType = (contentType: string | undefined): boolean =>
  parseMimeType(contentType).essence === 'text/event-stream'
