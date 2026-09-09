import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { EncodingObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { serializeFormPropertyWithEncoding } from './serialize-form-property'

/** A multipart array item shared by the request builder and code snippets. */
export type MultipartArrayPart = {
  key: string
  value: string | File
  contentType?: string
}

/**
 * Named multipart arrays produce one part per item, using the same property name.
 * Encoding applies to each item, including its content type. Without an explicit
 * style, nested arrays remain individual JSON values instead of expanding again.
 *
 * @see https://spec.openapis.org/oas/v3.2.0.html#encoding-by-name
 */
export const serializeMultipartArray = (
  key: string,
  value: unknown,
  encoding?: EncodingObject,
): MultipartArrayPart[] | null => {
  if (!Array.isArray(value)) {
    return null
  }

  const hasStyle =
    encoding?.style !== undefined || encoding?.explode !== undefined || encoding?.allowReserved !== undefined
  const contentType = hasStyle ? undefined : encoding?.contentType

  return value.flatMap((item): MultipartArrayPart[] => {
    const parts = serializeFormPropertyWithEncoding(key, item, encoding)
    if (parts) {
      return parts
    }

    if (item instanceof File) {
      return [{ key, value: unpackProxyObject(item), ...(contentType ? { contentType } : {}) }]
    }

    const structured = typeof item === 'object' && item !== null
    const itemContentType = contentType ?? (!hasStyle && structured ? 'application/json' : undefined)
    return [
      {
        key,
        value: structured ? JSON.stringify(unpackProxyObject(item)) : String(item),
        ...(itemContentType ? { contentType: itemContentType } : {}),
      },
    ]
  })
}
