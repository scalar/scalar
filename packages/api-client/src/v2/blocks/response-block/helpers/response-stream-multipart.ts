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
): ResponseStreamParser => {
  const boundary = parseMimeType(contentType).parameters.get('boundary')
  if (!boundary || !/^[0-9A-Za-z'()+_,\-./:=? ]{1,70}$/.test(boundary) || boundary.endsWith(' ')) {
    throw new Error('Multipart response requires a valid boundary parameter.')
  }
  if (nesting >= MAX_NESTING) {
    throw new Error('Multipart nesting exceeds the display limit.')
  }
  const marker = `--${boundary}`
  let buffer = ''
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
    emit(`Part ${partNumber}\n${headers ? `${headers}\n\n` : '\n'}`)
    if (parsedType.type === 'multipart') {
      const child = createMultipartParser(partType, emit, nesting + 1)
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

  const drain = (final: boolean): void => {
    let offset = 0
    while (!closed) {
      const index = buffer.indexOf(marker, offset)
      if (index < 0) {
        break
      }
      if (index !== 0 && buffer.slice(index - 2, index) !== '\r\n') {
        offset = index + marker.length
        continue
      }
      const afterMarker = index + marker.length
      const lineEnd = buffer.indexOf('\r\n', afterMarker)
      if (lineEnd < 0 && !final) {
        break
      }
      const suffix = buffer.slice(afterMarker, lineEnd < 0 ? undefined : lineEnd)
      const closing = /^--[ \t]*$/.test(suffix)
      if (!closing && !/^[ \t]*$/.test(suffix)) {
        offset = afterMarker
        continue
      }
      if (started) {
        emitPart(buffer.slice(0, Math.max(0, index - 2)))
      }
      started = true
      buffer = lineEnd < 0 ? '' : buffer.slice(lineEnd + 2)
      closed = closing
      offset = 0
    }
    if (buffer.length > MAX_PART_SIZE) {
      throw new Error('Multipart part exceeds the 8 MiB display limit.')
    }
    if (final && !closed) {
      throw new Error('Multipart response ended before its closing boundary.')
    }
  }

  return {
    push: (chunk) => {
      if (closed) {
        return
      }
      for (const byte of chunk) {
        buffer += String.fromCharCode(byte)
      }
      drain(false)
    },
    finish: () => drain(true),
  }
}
