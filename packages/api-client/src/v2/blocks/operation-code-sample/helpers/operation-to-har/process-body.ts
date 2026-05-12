import { json2xml } from '@scalar/helpers/file/json2xml'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import {
  getExample,
  getExampleFromSchema,
  serializeDeepObjectStyle,
  serializeFormStyle,
  serializePipeDelimitedStyle,
  serializeSpaceDelimitedStyle,
} from '@scalar/workspace-store/request-example'
import type {
  MediaTypeObject,
  RequestBodyObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { getResolvedRefDeep } from '@v2/blocks/operation-code-sample/helpers/get-resolved-ref-deep'
import type { Param, PostData } from 'har-format'

import type { OperationToHarProps } from './operation-to-har'

type ProcessBodyProps = Pick<OperationToHarProps, 'contentType' | 'example' | 'requestBodyCompositionSelection'> & {
  requestBody: RequestBodyObject
}

type MultipartEncodingMap = MediaTypeObject['encoding']

/**
 * Converts an object to an array of form parameters
 * @param obj - The object to convert
 * @returns Array of form parameters with name and value properties
 */
const objectToFormParams = (
  obj: object | { name: string; value: unknown; isDisabled: boolean }[],
  encoding?: MultipartEncodingMap,
  parentKey?: string,
  isMultipart = false,
): Param[] => {
  const params: Param[] = []

  /** Ensure we do not include disabled items */
  const entries = Array.isArray(obj)
    ? obj.filter((item) => !item.isDisabled).map((item) => [item.name, item.value])
    : Object.entries(obj)

  for (const [key, value] of entries) {
    if (value === undefined || value === null) {
      continue
    }

    const partEncoding = parentKey ? undefined : encoding?.[key]
    // Per OpenAPI 3.1.1: when style, explode, or allowReserved is explicitly set on the
    // encoding entry, contentType (implicit or explicit) is ignored and the value is
    // serialized as if it were a query-style parameter.
    const hasFormStyle =
      !!partEncoding &&
      (partEncoding.style !== undefined ||
        partEncoding.explode !== undefined ||
        partEncoding.allowReserved !== undefined)
    const explicitContentType = hasFormStyle ? undefined : partEncoding?.contentType

    // Per OpenAPI 3.1.1 §Encoding Object: when style/explode/allowReserved is set, the part
    // value is serialized as if it were a query-style parameter and contentType is ignored.
    // The query delimiters are stripped per Appendix C, so part names/values come straight
    // from the serializer. Primitives skip this branch and fall through to the String(value)
    // path below since style is a no-op for primitives. Files skip too, as do arrays
    // containing Files — RFC6570 expansion of binary data is undefined per spec line 4181,
    // and the array branch below already emits one `@filename` part per File.
    // allowReserved only affects percent-encoding, which is a no-op at the HAR layer (values
    // are raw bytes in part bodies); its presence still opts into this branch per spec.
    if (
      isMultipart &&
      !parentKey &&
      hasFormStyle &&
      typeof value === 'object' &&
      value !== null &&
      !(value instanceof File) &&
      !(Array.isArray(value) && value.some((item) => item instanceof File))
    ) {
      const unpacked = unpackProxyObject(value)
      const style = partEncoding?.style ?? 'form'
      // OAS defaults: explode is true for "form", false for everything else.
      const explode = partEncoding?.explode ?? style === 'form'

      if (style === 'deepObject') {
        // explode:false with deepObject is undefined per spec; we invoke the serializer
        // either way so authors get useful output instead of nothing.
        for (const entry of serializeDeepObjectStyle(key, unpacked)) {
          params.push({ name: entry.key, value: String(entry.value) })
        }
      } else if (style === 'spaceDelimited') {
        params.push({ name: key, value: String(serializeSpaceDelimitedStyle(unpacked)) })
      } else if (style === 'pipeDelimited') {
        params.push({ name: key, value: String(serializePipeDelimitedStyle(unpacked)) })
      } else {
        const serialized = serializeFormStyle(unpacked, explode)
        if (Array.isArray(serialized)) {
          for (const entry of serialized) {
            // Arrays: entry.key === '' → fall back to the outer name.
            // Objects: entry.key is the inner property name (spec strips the outer name).
            params.push({ name: entry.key || key, value: String(entry.value) })
          }
        } else {
          params.push({ name: key, value: String(serialized) })
        }
      }
    }
    // Handle File objects by converting them to 'BINARY'
    else if (value instanceof File) {
      const file = unpackProxyObject(value)
      params.push({
        name: key,
        value: `@${file.name}`,
        ...(explicitContentType ? { contentType: explicitContentType } : {}),
      })
    }
    // Multipart encodings can override the entire top-level part payload
    else if (explicitContentType && typeof value === 'object') {
      params.push({
        name: key,
        value: JSON.stringify(unpackProxyObject(value)),
        contentType: explicitContentType,
      })
    }
    // Per OpenAPI 3.x: a top-level multipart property whose value is an object (and not a File)
    // defaults to a single part encoded as application/json, rather than being flattened
    // into multiple parts with dotted keys.
    else if (isMultipart && !parentKey && !hasFormStyle && typeof value === 'object' && !Array.isArray(value)) {
      params.push({
        name: key,
        value: JSON.stringify(unpackProxyObject(value)),
        contentType: 'application/json',
      })
    }
    // Handle arrays by adding each item with the same key
    else if (Array.isArray(value)) {
      for (const item of value) {
        // Check if array item is a File
        if (item instanceof File) {
          const file = unpackProxyObject(item)
          params.push({ name: key, value: `@${file.name}` })
        }
        // Per OpenAPI 3.x: a top-level multipart array of complex items defaults each part
        // to application/json, instead of flattening object items into dotted keys.
        else if (isMultipart && !parentKey && !hasFormStyle && typeof item === 'object' && item !== null) {
          params.push({
            name: key,
            value: JSON.stringify(unpackProxyObject(item)),
            contentType: 'application/json',
          })
        } else {
          params.push({ name: key, value: String(item) })
        }
      }
    }
    // Handle nested objects by flattening them
    else if (typeof value === 'object') {
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
        params: objectToFormParams(
          exampleValue,
          _contentType === 'multipart/form-data' ? encoding : undefined,
          undefined,
          _contentType === 'multipart/form-data',
        ),
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
          params: objectToFormParams(
            extractedExample,
            _contentType === 'multipart/form-data' ? encoding : undefined,
            undefined,
            _contentType === 'multipart/form-data',
          ),
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
