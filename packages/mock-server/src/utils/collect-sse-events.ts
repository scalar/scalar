import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/**
 * How many events a schema-generated `text/event-stream` response emits.
 *
 * A single event barely exercises a client's read loop, and an endless stream would never let a
 * request finish, so the mock sends a short, finite burst and closes.
 */
const GENERATED_EVENT_COUNT = 3

/**
 * Matches text that is already Server-Sent Events framing, so it is written to the wire as is.
 *
 * Some documents spell the wire format out in their example (`data: {"type":"edit"}\n\n`) instead of
 * describing a single event payload. Wrapping that in another `data:` line would hand the client the
 * framing as its payload, so it is passed through untouched.
 */
const SSE_FRAMING = /^(?:data|event|id|retry):/m

/** One event of a mocked Server-Sent Events response. */
type SseEvent = {
  /** Already-framed event text when `framed` is true, otherwise the `data` payload of one event. */
  text: string
  /** Whether `text` is complete SSE framing that has to be written verbatim. */
  framed: boolean
}

/** Closes framed text with the blank line that ends an SSE event, if the document left it out. */
const terminate = (text: string): string => (text.endsWith('\n\n') ? text : `${text}\n\n`)

/** Turns one payload into an event, serializing anything that is not already text. */
const toEvent = (payload: unknown): SseEvent => {
  if (typeof payload !== 'string') {
    // `undefined` has no JSON representation, so fall back to `null` rather than an empty event.
    return { text: JSON.stringify(payload) ?? 'null', framed: false }
  }

  return SSE_FRAMING.test(payload) ? { text: terminate(payload), framed: true } : { text: payload, framed: false }
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
 * 1. A named example requested via `Prefer: example=<name>` pins the stream to that one event.
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

  return Array.isArray(generated)
    ? generated.map(toEvent)
    : Array.from({ length: GENERATED_EVENT_COUNT }, () => toEvent(generated))
}

/** Whether a media type is Server-Sent Events, ignoring parameters such as `; charset=utf-8`. */
export const isEventStreamContentType = (contentType: string | undefined | null): boolean =>
  contentType?.split(';')[0]?.trim().toLowerCase() === 'text/event-stream'
