import { parseMimeType } from '@scalar/helpers/http/mime-type'

import { isTextMediaType } from '@/v2/blocks/response-block/helpers/media-types'

/**
 * Decode the buffer according to its content-type
 *
 * @returns The decoded string or Blob
 */
export const decodeBuffer = (buffer: ArrayBuffer, contentType: string): string | Blob => {
  const mimeType = parseMimeType(contentType)

  // Text
  if (isTextMediaType(mimeType.essence)) {
    const decoder = new TextDecoder(mimeType.parameters.get('charset'))
    return decoder.decode(buffer)
  }

  // Binary
  return new Blob([buffer], { type: mimeType.essence })
}
