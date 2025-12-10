import MimeTypeParser from 'whatwg-mimetype'

import { isTextMediaType } from '@/views/Request/consts'

/**
 * Decode the buffer according to its content-type
 *
 * @returns The decoded string or Blob
 */
export const decodeBuffer = (buffer: ArrayBuffer, contentType: string): string | Blob => {
  const mimeType = new MimeTypeParser(contentType)

  // Text
  if (isTextMediaType(mimeType.essence)) {
    const decoder = new TextDecoder(mimeType.parameters.get('charset'))
    return decoder.decode(buffer)
  }

  // Binary
  return new Blob([buffer], { type: mimeType.essence })
}
