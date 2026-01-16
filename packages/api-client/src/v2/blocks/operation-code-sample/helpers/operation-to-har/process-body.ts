import { json2xml } from '@scalar/helpers/file/json2xml'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { getExampleFromSchema } from '@v2/blocks/operation-code-sample/helpers/get-example-from-schema'
import type { Param, PostData } from 'har-format'

import { getExample } from '@/v2/blocks/operation-block/helpers/get-example'

import type { OperationToHarProps } from './operation-to-har'

type ProcessBodyProps = Pick<OperationToHarProps, 'contentType' | 'example'> & {
  requestBody: RequestBodyObject
}

/**
 * Converts an object to an array of form parameters
 * @param obj - The object to convert
 * @returns Array of form parameters with name and value properties
 */
const objectToFormParams = (obj: object | { name: string; value: string; isDisabled: boolean }[]): Param[] => {
  const params: Param[] = []

  /** Ensure we do not include disabled items */
  const entries = Array.isArray(obj)
    ? obj.filter((item) => !item.isDisabled).map((item) => [item.name, item.value])
    : Object.entries(obj)

  for (const [key, value] of entries) {
    if (value === undefined || value === null) {
      continue
    }

    // Handle File objects by converting them to 'BINARY'
    if (value instanceof File) {
      const file = unpackProxyObject(value)
      params.push({ name: key, value: `@${file.name}` })
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
      const nestedParams = objectToFormParams(value)

      for (const param of nestedParams) {
        params.push({ name: `${key}.${param.name}`, value: param.value })
      }
    } else {
      params.push({ name: key, value: String(value) })
    }
  }

  return params
}

/**
 * Processes the request body and returns the processed data
 * Returns undefined if no example is found
 */
export const processBody = ({ requestBody, contentType, example }: ProcessBodyProps): PostData | undefined => {
  const _contentType = contentType || Object.keys(requestBody.content)[0] || ''

  // Check if this is a form data content type
  const isFormData = _contentType === 'multipart/form-data' || _contentType === 'application/x-www-form-urlencoded'

  // Check if this is an XML content type
  const isXml = _contentType === 'application/xml'

  // Get the example value
  const _example = getExample(requestBody, example, contentType)?.value

  // Return the provided top level example
  if (typeof _example !== 'undefined') {
    if (isFormData && typeof _example === 'object' && _example !== null) {
      return {
        mimeType: _contentType,
        params: objectToFormParams(_example),
      }
    }

    if (isXml && typeof _example === 'object' && _example !== null) {
      return {
        mimeType: _contentType,
        text: json2xml(_example),
      }
    }

    return {
      mimeType: _contentType,
      text: typeof _example === 'string' ? _example : JSON.stringify(_example),
    }
  }

  // Try to extract examples from the schema
  const contentSchema = getResolvedRef(requestBody.content[_contentType]?.schema)
  if (typeof contentSchema !== 'undefined') {
    const extractedExample = getExampleFromSchema(contentSchema, {
      mode: 'write',
      xml: isXml,
    })

    if (extractedExample !== undefined) {
      if (isFormData && typeof extractedExample === 'object' && extractedExample !== null) {
        return {
          mimeType: _contentType,
          params: objectToFormParams(extractedExample),
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
