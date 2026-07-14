import { json2xml } from '@scalar/helpers/file/json2xml'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import {
  getExample,
  getExampleFromSchema,
  serializeFormPropertyWithEncoding,
} from '@scalar/workspace-store/request-example'
import type {
  MediaTypeObject,
  RequestBodyObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Param, PostData } from 'har-format'

import type { OperationToHarProps } from './operation-to-har'

type ProcessBodyProps = Pick<OperationToHarProps, 'contentType' | 'example' | 'requestBodyCompositionSelection'> & {
  requestBody: RequestBodyObject
}

type MultipartEncodingMap = MediaTypeObject['encoding']

/**
 * Converts a form-data body into HAR `Param[]` entries for `multipart/form-data`
 * and `application/x-www-form-urlencoded` requests.
 *
 * Per OpenAPI 3.1.x Encoding Object, each property's serialization is governed
 * by an optional Encoding entry. When `style` / `explode` / `allowReserved` is
 * set, the value is serialized RFC6570-style and `contentType` is ignored.
 * When only `contentType` is set, the property becomes a single part with that
 * type. Otherwise spec defaults apply (object → `application/json` for multipart,
 * primitives → `text/plain`).
 *
 * @param obj - The form-data payload, either an object keyed by property name
 *   or a HAR-style `{ name, value, isDisabled }[]` array.
 * @param encoding - The `encoding` map from the Media Type Object, if any.
 *   Used only at the top level (`parentKey` undefined).
 * @param parentKey - When set, we are flattening a nested object inside another
 *   property; encoding is ignored and keys are joined with `.` (legacy default).
 * @param isMultipart - True for `multipart/form-data`. Gates the spec defaults
 *   for object/array properties that should become a single `application/json`
 *   part. Urlencoded bodies skip those branches and fall through to flattening.
 */
const objectToFormParams = (
  obj: object | { name: string; value: unknown; isDisabled: boolean }[],
  encoding?: MultipartEncodingMap,
  parentKey?: string,
  isMultipart = false,
): Param[] => {
  const params: Param[] = []

  /** Ensure we do not include disabled items */
  const entries: [string, unknown][] = Array.isArray(obj)
    ? obj.filter((item) => !item.isDisabled).map((item) => [String(item.name), item.value])
    : Object.entries(obj)

  for (const [key, value] of entries) {
    if (value === undefined || value === null) {
      continue
    }

    const partEncoding = parentKey ? undefined : encoding?.[key]
    /**
     * Per OpenAPI 3.1.1: when style, explode, or allowReserved is explicitly set on the
     * encoding entry, contentType (implicit or explicit) is ignored and the value is
     * serialized as if it were a query-style parameter.
     */
    const hasFormStyle =
      partEncoding &&
      (partEncoding.style !== undefined ||
        partEncoding.explode !== undefined ||
        partEncoding.allowReserved !== undefined)
    /**
     * Per OAS 3.1.x Encoding Object: `contentType` SHALL be ignored if the request body
     * media type is not a multipart. For `application/x-www-form-urlencoded` we still
     * honor `style`/`explode`/`allowReserved` (handled above), but a `contentType`-only
     * entry has no effect — values fall through to the dotted-key flattening default.
     */
    const explicitContentType = hasFormStyle || !isMultipart ? undefined : partEncoding?.contentType

    /**
     * When the encoding sets style/explode/allowReserved, serialize the value RFC6570-style
     * (bracket/exploded notation) and ignore contentType. See `serializeFormPropertyWithEncoding`
     * for the per-style rules; it returns null for primitives, Files, and arrays of Files, which
     * then fall through to the dedicated branches below. HAR represents multipart and urlencoded
     * the same way via `PostData.params`, so the resulting parts work for both.
     */
    const styleParams = parentKey ? null : serializeFormPropertyWithEncoding(key, value, partEncoding)
    if (styleParams) {
      for (const param of styleParams) {
        params.push({ name: param.key, value: param.value })
      }
    } else if (value instanceof File) {
      /**
       * File values render as `@filename` references, the conventional cURL syntax for an
       * attached file. Picked up by snippet renderers downstream (e.g. `--form 'x=@file.png'`).
       */
      const file = unpackProxyObject(value)
      params.push({
        name: key,
        value: `@${file.name}`,
        ...(explicitContentType ? { contentType: explicitContentType } : {}),
      })
    } else if (explicitContentType && typeof value === 'object') {
      /**
       * Per OAS 3.1.x Encoding Object: an explicit `encoding[key].contentType` on a
       * complex value overrides the default and emits a single part containing the value
       * JSON-stringified into that media type. Only reachable when style/explode/allowReserved
       * are unset (otherwise contentType is ignored — see the style branch above).
       */
      params.push({
        name: key,
        value: JSON.stringify(unpackProxyObject(value)),
        contentType: explicitContentType,
      })
    } else if (isMultipart && !parentKey && !hasFormStyle && typeof value === 'object' && !Array.isArray(value)) {
      /**
       * Per OpenAPI 3.x: a top-level multipart property whose value is an object (and not a File)
       * defaults to a single part encoded as application/json, rather than being flattened
       * into multiple parts with dotted keys.
       */
      params.push({
        name: key,
        value: JSON.stringify(unpackProxyObject(value)),
        contentType: 'application/json',
      })
    } else if (
      Array.isArray(value) &&
      isMultipart &&
      !parentKey &&
      !hasFormStyle &&
      value.some((item) => typeof item === 'object' && item !== null && !(item instanceof File))
    ) {
      /**
       * Per OpenAPI 3.x: a top-level multipart array whose items are objects defaults to a single
       * `application/json` part containing the whole array. Serializing each item into its own part
       * would drop the enclosing array wrapper and emit a bare object (see issue #9688), so keep the
       * array intact and stringify it as one value.
       */
      params.push({
        name: key,
        value: JSON.stringify(unpackProxyObject(value)),
        contentType: 'application/json',
      })
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item instanceof File) {
          const file = unpackProxyObject(item)
          params.push({ name: key, value: `@${file.name}` })
        } else {
          params.push({ name: key, value: String(item) })
        }
      }
    } else if (typeof value === 'object') {
      /**
       * Legacy fallback: flatten nested objects into dotted-key parts. Reached when the
       * multipart JSON-default branches above don't apply — i.e. either inside a recursive
       * call (`parentKey` set) or on `application/x-www-form-urlencoded` bodies without an
       * explicit encoding entry. Strict OAS 3.1.x would use `style: form, explode: true` as
       * the urlencoded default (inner keys become top-level params); we keep dotted keys for
       * backwards compatibility with consumers that already parse this shape.
       */
      const nestedParams = objectToFormParams(value, undefined, key)

      for (const param of nestedParams) {
        params.push({ name: `${key}.${param.name}`, value: param.value })
      }
    } else {
      params.push({
        name: key,
        value: String(value),
        ...(explicitContentType ? { contentType: explicitContentType } : {}),
      })
    }
  }

  return params
}

/**
 * Processes the request body and returns the processed data
 * Returns undefined if no example is found
 */
export const processBody = ({
  requestBody,
  contentType,
  example,
  requestBodyCompositionSelection,
}: ProcessBodyProps): PostData | undefined => {
  const _contentType = contentType || Object.keys(requestBody.content)[0] || ''
  /** Empty when "Other" is selected so snippets do not inject `Content-Type: other`. */
  const harMimeType = _contentType === 'other' ? '' : _contentType
  const formatBinaryFile = (file: File) => {
    const unwrappedFile = unpackProxyObject(file)
    return `@${unwrappedFile.name || 'filename'}`
  }
  const encoding = requestBody.content[_contentType]?.encoding

  // Check if this is a form data content type
  const isFormData = _contentType === 'multipart/form-data' || _contentType === 'application/x-www-form-urlencoded'

  // Check if this is an XML content type
  const isXml = _contentType === 'application/xml'

  // Get the example value
  const _example = getExample(requestBody, example, contentType)?.value

  // Return the provided top level example
  if (typeof _example !== 'undefined') {
    const exampleValue = _example !== null && typeof _example === 'object' ? unpackProxyObject(_example) : _example

    if (isFormData && typeof exampleValue === 'object' && exampleValue !== null) {
      return {
        mimeType: harMimeType,
        params: objectToFormParams(exampleValue, encoding, undefined, _contentType === 'multipart/form-data'),
      }
    }

    if (isXml && typeof exampleValue === 'object' && exampleValue !== null) {
      return {
        mimeType: harMimeType,
        text: json2xml(exampleValue),
      }
    }

    if (exampleValue instanceof File) {
      return {
        mimeType: harMimeType,
        text: formatBinaryFile(exampleValue),
      }
    }

    return {
      mimeType: harMimeType,
      text: typeof exampleValue === 'string' ? exampleValue : JSON.stringify(exampleValue),
    }
  }

  // Try to extract examples from the schema
  const contentSchema = getResolvedRef(requestBody.content[_contentType]?.schema)
  if (typeof contentSchema !== 'undefined') {
    const resolvedContentSchema = getResolvedRefDeep(contentSchema) as SchemaObject
    const extractedExample = getExampleFromSchema(
      resolvedContentSchema,
      {
        compositionSelection: requestBodyCompositionSelection,
        mode: 'write',
        xml: isXml,
      },
      {
        schemaPath: ['requestBody'],
      },
    )

    if (extractedExample !== undefined) {
      if (isFormData && typeof extractedExample === 'object' && extractedExample !== null) {
        return {
          mimeType: harMimeType,
          params: objectToFormParams(extractedExample, encoding, undefined, _contentType === 'multipart/form-data'),
        }
      }

      if (isXml && typeof extractedExample === 'object' && extractedExample !== null) {
        return {
          mimeType: harMimeType,
          text: json2xml(extractedExample),
        }
      }

      return {
        mimeType: harMimeType,
        text: typeof extractedExample === 'string' ? extractedExample : JSON.stringify(extractedExample),
      }
    }
  }

  return undefined
}
