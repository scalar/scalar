import { parseMimeType } from '@scalar/helpers/http/mime-type'

import { createMultipartParser } from './response-stream-multipart'

/** Formats with record framing that can be displayed before the response finishes. */
type ResponseStreamFormat = 'text' | 'json-lines' | 'json-seq' | 'multipart'

/** Only opt recognized streaming media types into the reader path. */
export const getResponseStreamFormat = (contentType: string): ResponseStreamFormat | undefined => {
  const { essence, type, subtype } = parseMimeType(contentType)
  if (essence === 'text/event-stream') {
    return 'text'
  }
  if (['application/jsonl', 'application/x-ndjson', 'application/json-lines'].includes(essence)) {
    return 'json-lines'
  }
  if (type === 'application' && (subtype === 'json-seq' || subtype.endsWith('+json-seq'))) {
    return 'json-seq'
  }
  return type === 'multipart' ? 'multipart' : undefined
}

/** A push parser keeps transport cancellation and UI updates outside the framing logic. */
export type ResponseStreamParser = {
  push: (chunk: Uint8Array) => void
  finish: () => void
}

/** Bound unfinished records, including servers that never send a delimiter. */
const MAX_STREAM_RECORD_SIZE = 8 * 1024 * 1024

/** Decode complete records while retaining partial UTF-8 characters across network chunks. */
export const createResponseStreamParser = (contentType: string, emit: (text: string) => void): ResponseStreamParser => {
  const format = getResponseStreamFormat(contentType)
  if (format === 'multipart') {
    return createMultipartParser(contentType, emit)
  }
  const decoder = new TextDecoder('utf-8', { fatal: format !== 'text' && format !== undefined })
  let buffer = ''
  let started = false
  let depth = 0
  let quoted = false
  let escaped = false

  const flush = (): void => {
    const record = buffer
    buffer = ''
    depth = 0
    quoted = false
    escaped = false
    if (!record.trim()) {
      return
    }
    let formatted: string
    try {
      const value: unknown = JSON.parse(record)
      // RFC 7464 requires trailing whitespace for non-self-delimiting primitive values.
      if (format === 'json-seq' && typeof value !== 'object' && typeof value !== 'string' && !/\s$/.test(record)) {
        throw new Error('Truncated primitive')
      }
      if (format === 'json-seq' && value === null && !/\s$/.test(record)) {
        throw new Error('Truncated null')
      }
      formatted = `${JSON.stringify(value, null, 2)}\n`
    } catch {
      formatted = `[Invalid JSON record]\n${record.trim()}\n`
    }
    emit(formatted)
  }

  const consume = (text: string): void => {
    if (format !== 'json-lines' && format !== 'json-seq') {
      emit(text)
      return
    }
    for (const char of text) {
      if (format === 'json-seq' && char === '\x1e') {
        flush()
        started = true
        continue
      }
      if (format === 'json-seq' && !started) {
        if (char.trim()) {
          throw new Error('JSON sequence record is missing its record separator.')
        }
        continue
      }
      buffer += char
      if (buffer.length > MAX_STREAM_RECORD_SIZE) {
        throw new Error('Stream record exceeds the 8 MiB display limit.')
      }
      if (format === 'json-lines') {
        if (char === '\n') {
          flush()
        }
        continue
      }
      if (quoted) {
        if (escaped) {
          escaped = false
        } else if (char === '\\') {
          escaped = true
        } else if (char === '"') {
          quoted = false
        }
      } else if (char === '"') {
        quoted = true
      } else if (char === '{' || char === '[') {
        depth++
      } else if (char === '}' || char === ']') {
        depth--
      }
      if (char === '\n' && !quoted && depth === 0) {
        flush()
        started = false
      }
    }
  }

  return {
    push: (chunk) => consume(decoder.decode(chunk, { stream: true })),
    finish: () => {
      consume(decoder.decode())
      flush()
    },
  }
}
