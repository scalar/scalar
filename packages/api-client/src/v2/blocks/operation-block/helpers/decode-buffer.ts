import { parseMimeType } from '@scalar/helpers/http/mime-type'
import type { ResponseBodyHandler } from '@scalar/oas-utils/helpers'

import { isTextMediaType } from '@/v2/blocks/response-block/helpers/media-types'

/**
 * Decode the buffer according to its content-type.
 * When a plugin handler with a custom `decode` function is provided, it takes priority
 * over the default text/binary decoding.
 *
 * @returns The decoded string or Blob
 */
export const decodeBuffer = async (
  buffer: ArrayBuffer,
  contentType: string,
  pluginHandler?: ResponseBodyHandler,
): Promise<string | Blob> => {
  const mimeType = parseMimeType(contentType)

  if (pluginHandler?.decode) {
    return await pluginHandler.decode(buffer, contentType)
  }

  // Text
  if (isTextMediaType(mimeType.essence)) {
    const decoder = new TextDecoder(mimeType.parameters.get('charset'))
    return decoder.decode(buffer)
  }

  // Binary
  return new Blob([buffer], { type: mimeType.essence })
}
