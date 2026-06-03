import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { EncodingObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import {
  serializeDeepObjectStyle,
  serializeFormStyle,
  serializePipeDelimitedStyle,
  serializeSpaceDelimitedStyle,
} from '../header/serialize-parameter'

/** A single serialized form field, ready to become a multipart part or a urlencoded pair. */
export type SerializedFormProperty = { key: string; value: string }

/**
 * Stringify a value emitted by `serializeFormStyle` into a form field value.
 *
 * Form-style serialization only addresses one level of nesting per RFC6570; deeper
 * structures (an object or array still sitting in `entry.value`) are spec-undefined.
 * JSON-stringify them so the output stays readable instead of `String(value)` returning
 * `"[object Object]"`. Primitives pass through `String()` to preserve the existing wire
 * shape (e.g. `true` -> `"true"`).
 */
const stringifyEntryValue = (value: unknown): string =>
  value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value)

/**
 * Serialize a `multipart/form-data` or `application/x-www-form-urlencoded` property
 * according to its OpenAPI Encoding Object when `style` / `explode` / `allowReserved`
 * is set. The value is serialized RFC6570-style (like a query parameter) into one or
 * more key/value parts — for example `style: deepObject` turns `{ address: { city } }`
 * into `address[city]=...` bracket notation, and `style: form, explode: true` breaks an
 * object into one part per property.
 *
 * Returns `null` when the encoding does not opt into style-based serialization, so callers
 * keep their default handling (JSON for objects, `contentType` parts, file uploads). This
 * is shared by the request builder (`build-request-body`) and the code-snippet generator
 * (`process-body`) so the request sent over the wire matches the generated snippet.
 *
 * @see https://spec.openapis.org/oas/v3.1.1.html#encoding-object
 */
export const serializeFormPropertyWithEncoding = (
  key: string,
  value: unknown,
  encoding: EncodingObject | undefined,
): SerializedFormProperty[] | null => {
  /**
   * Per OpenAPI 3.1.x: when style, explode, or allowReserved is explicitly set, the value
   * is serialized as if it were a query-style parameter and contentType is ignored.
   */
  const hasFormStyle =
    !!encoding &&
    (encoding.style !== undefined || encoding.explode !== undefined || encoding.allowReserved !== undefined)

  if (!hasFormStyle) {
    return null
  }

  /**
   * Style is a no-op for primitives, and RFC6570 expansion of binary data is undefined
   * (spec §Appendix C). Files and arrays containing Files keep their dedicated handling in
   * the caller, so we bail out and let the default path emit those parts.
   */
  if (
    typeof value !== 'object' ||
    value === null ||
    value instanceof File ||
    (Array.isArray(value) && value.some((item) => item instanceof File))
  ) {
    return null
  }

  const unpacked = unpackProxyObject(value)
  /**
   * OAS Encoding follows query-parameter defaults: when no `style` is set the default is
   * "form"; when no `explode` is set the default is `true` for "form" and `false` otherwise.
   */
  const style = encoding?.style ?? 'form'
  const explode = encoding?.explode ?? style === 'form'

  const params: SerializedFormProperty[] = []

  if (style === 'deepObject') {
    if (Array.isArray(unpacked)) {
      /**
       * deepObject-on-array is marked n/a by the spec; fall back to the form/explode:true
       * shape so the array still reaches the wire instead of being silently dropped.
       */
      const serialized = serializeFormStyle(unpacked, true)
      if (Array.isArray(serialized)) {
        for (const entry of serialized) {
          params.push({ key: entry.key || key, value: stringifyEntryValue(entry.value) })
        }
      } else {
        params.push({ key, value: String(serialized) })
      }
    } else {
      for (const entry of serializeDeepObjectStyle(key, unpacked)) {
        params.push({ key: entry.key, value: String(entry.value) })
      }
    }
  } else if (style === 'spaceDelimited') {
    params.push({ key, value: String(serializeSpaceDelimitedStyle(unpacked)) })
  } else if (style === 'pipeDelimited') {
    params.push({ key, value: String(serializePipeDelimitedStyle(unpacked)) })
  } else {
    const serialized = serializeFormStyle(unpacked, explode)
    if (Array.isArray(serialized)) {
      for (const entry of serialized) {
        /**
         * Arrays: `entry.key === ''` -> fall back to the outer name.
         * Objects: `entry.key` is the inner property name (the spec strips the outer name).
         */
        params.push({ key: entry.key || key, value: stringifyEntryValue(entry.value) })
      }
    } else {
      params.push({ key, value: String(serialized) })
    }
  }

  return params
}
