import { parseMimeType } from '@scalar/helpers/http/mime-type'

import type { ResponseStreamParser } from './response-stream'

const MAX_PART_SIZE = 8 * 1024 * 1024
const MAX_NESTING = 8

/** Preserve every byte until MIME boundaries identify a complete part. */
const decodeBytes = (bytes: string): Uint8Array => Uint8Array.from(bytes, (char) => char.charCodeAt(0))

/** Parse MIME delimiter lines, never treating boundary-like body bytes as separators. */
export const createMultipartParser = (
  contentType: string,
  emit: (text: string) => void,
  nesting = 0,
  prefix = '',
): ResponseStreamParser => {
  const boundary = parseMimeType(contentType).parameters.get('boundary')
  if (!boundary || !/^[0-9A-Za-z'()+_,\-./:=? ]{1,70}$/.test(boundary) || boundary.endsWith(' ')) {
    throw new Error('Multipart response requires a valid boundary parameter.')
  }
  if (nesting >= MAX_NESTING) {
    throw new Error('Multipart nesting exceeds the display limit.')
  }
  const marker = new TextEncoder().encode(`--${boundary}`)
  let buffer = new Uint8Array(1024)
  let length = 0
  let offset = 0
  let lineOffset = 0
  let started = false
  let closed = false
  let partNumber = 0

  const emitPart = (part: string): void => {
    if (part.length > MAX_PART_SIZE) {
      throw new Error('Multipart part exceeds the 8 MiB display limit.')
    }
    // Empty header sections have only the CRLF separating headers from the body.
    const separator = part.startsWith('\r\n') ? 0 : part.indexOf('\r\n\r\n')
    if (separator < 0) {
      throw new Error('Multipart part is missing its header separator.')
    }
    const headers = part.slice(0, separator)
    const body = part.slice(separator + (separator === 0 ? 2 : 4))
    const unfolded = headers.replace(/\r\n[ \t]+/g, ' ')
    const partType = unfolded.match(/^content-type:\s*(.+)$/im)?.[1]?.trim() ?? 'text/plain'
    const parsedType = parseMimeType(partType)
    partNumber++
    const label = `${prefix}${partNumber}`
    emit(`Part ${label}\n${headers ? `${headers}\n\n` : '\n'}`)
    if (parsedType.type === 'multipart') {
      const child = createMultipartParser(partType, emit, nesting + 1, `${label}.`)
      child.push(decodeBytes(body))
      child.finish()
    } else if (parsedType.type === 'text' || /(?:json|xml)$/.test(parsedType.subtype)) {
      const text = new TextDecoder(parsedType.parameters.get('charset') ?? 'utf-8').decode(decodeBytes(body))
      let formatted = text
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        // Text and XML parts remain readable without JSON interpretation.
      }
      emit(`${formatted}\n`)
    } else {
      // Base64 preserves binary part bytes without injecting control characters into the UI.
      emit(`[Binary part: ${body.length} bytes, base64]\n${btoa(body)}\n`)
    }
  }

  // Convert only completed parts, in bounded slices that do not exceed argument limits.
  const toByteString = (bytes: Uint8Array): string => {
    const slices: string[] = []
    for (let index = 0; index < bytes.length; index += 8192) {
      slices.push(String.fromCharCode(...bytes.subarray(index, index + 8192)))
    }
    return slices.join('')
  }

  const drain = (final: boolean): void => {
    while (!closed && offset + marker.length <= length) {
      const index = offset
      const matches =
        (index === 0 || (buffer[index - 2] === 13 && buffer[index - 1] === 10)) &&
        marker.every((byte, position) => buffer[index + position] === byte)
      if (!matches) {
        offset++
        continue
      }
      const afterMarker = index + marker.length
      // Remember incomplete delimiter lines too, including long transport padding.
      lineOffset = Math.max(lineOffset, afterMarker)
      while (lineOffset + 1 < length && !(buffer[lineOffset] === 13 && buffer[lineOffset + 1] === 10)) {
        lineOffset++
      }
      const lineEnd = lineOffset + 1 < length ? lineOffset : -1
      if (lineEnd < 0 && !final) {
        break
      }
      const suffix = toByteString(buffer.subarray(afterMarker, lineEnd < 0 ? length : lineEnd))
      const closing = /^--[ \t]*$/.test(suffix)
      if (!closing && !/^[ \t]*$/.test(suffix)) {
        offset = afterMarker
        lineOffset = 0
        continue
      }
      if (started) {
        emitPart(toByteString(buffer.subarray(0, Math.max(0, index - 2))))
      }
      started = true
      const consumed = lineEnd < 0 ? length : lineEnd + 2
      buffer.copyWithin(0, consumed, length)
      length -= consumed
      closed = closing
      offset = 0
      lineOffset = 0
    }
    if (length > MAX_PART_SIZE) {
      throw new Error('Multipart part exceeds the 8 MiB display limit.')
    }
    if (final && !closed) {
      throw new Error('Multipart response ended before its closing boundary.')
    }
  }

  return {
    push: (chunk) => {
      // Bound each append even when the transport delivers a very large chunk.
      for (let index = 0; index < chunk.length && !closed; index += 65536) {
        const slice = chunk.subarray(index, index + 65536)
        if (length + slice.length > buffer.length) {
          const grown = new Uint8Array(Math.max(buffer.length * 2, length + slice.length))
          grown.set(buffer.subarray(0, length))
          buffer = grown
        }
        buffer.set(slice, length)
        length += slice.length
        drain(false)
      }
    },
    finish: () => drain(true),
  }
}
