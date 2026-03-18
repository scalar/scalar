import { json2xml } from '@scalar/helpers/file/json2xml'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { MediaTypeObject, RequestBodyObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { getExampleFromSchema } from '@v2/blocks/operation-code-sample/helpers/get-example-from-schema'
import { getResolvedRefDeep } from '@v2/blocks/operation-code-sample/helpers/get-resolved-ref-deep'
import type { Param, PostData } from 'har-format'

import { getExample } from '@/v2/blocks/operation-block/helpers/get-example'

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

    const partContentType = parentKey ? undefined : encoding?.[key]?.contentType

    // Handle File objects by converting them to 'BINARY'
    if (value instanceof File) {
      const file = unpackProxyObject(value)
      params.push({ name: key, value: `@${file.name}`, ...(partContentType ? { contentType: partContentType } : {}) })
    }
    // Multipart encodings can override the entire top-level part payload
    else if (partContentType && typeof value === 'object') {
      params.push({
        name: key,
        value: JSON.stringify(unpackProxyObject(value)),
        contentType: partContentType,
      })
    }
    // Handle arrays by adding each item with the same key
    else if (Array.isArray(value)) {
      for (const item of value) {
        // Check if array item is a File
        if (item instanceof File) {
          const file = unpackProxyObject(item)
          params.push({ name: key, value: `@${file.name}` })
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
      params.push({ name: key, value: String(value), ...(partContentType ? { contentType: partContentType } : {}) })
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
        mimeType: _contentType,
        params: objectToFormParams(exampleValue, _contentType === 'multipart/form-data' ? encoding : undefined),
      }
    }

    if (isXml && typeof exampleValue === 'object' && exampleValue !== null) {
      return {
        mimeType: _contentType,
        text: json2xml(exampleValue),
      }
    }

    if (exampleValue instanceof File) {
      return {
        mimeType: _contentType,
        text: formatBinaryFile(exampleValue),
      }
    }

    return {
      mimeType: _contentType,
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
          mimeType: _contentType,
          params: objectToFormParams(extractedExample, _contentType === 'multipart/form-data' ? encoding : undefined),
        }
      }

      if (isXml && typeof extractedExample === 'object' && extractedExample !== null) {
        return {
          mimeType: _contentType,
          text: json2xml(extractedExample),
        }
      }

      return {
        mimeType: _contentType,
        text: typeof extractedExample === 'string' ? extractedExample : JSON.stringify(extractedExample),
      }
    }
  }

  return undefined
}
