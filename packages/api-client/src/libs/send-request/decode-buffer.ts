import { isTextMediaType } from '@/views/Request/consts'
import MimeTypeParser from 'whatwg-mimetype'

// TODO: This should return `unknown` to acknowledge we don't know type, shouldn't it?
/** Decode the buffer according to its content-type */
export function decodeBuffer(buffer: ArrayBuffer, contentType: string) {
  const mimeType = new MimeTypeParser(contentType)

  if (isTextMediaType(mimeType.essence)) {
    const decoder = new TextDecoder(mimeType.parameters.get('charset'))
    const string = decoder.decode(buffer)

    // Text
    return string
  }

  // Binary
  return new Blob([buffer], { type: mimeType.essence })
}
