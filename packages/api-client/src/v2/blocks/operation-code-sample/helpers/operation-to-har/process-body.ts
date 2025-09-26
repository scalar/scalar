import { json2xml } from '@scalar/helpers/file/json2xml'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { getExampleFromSchema } from '@v2/blocks/operation-code-sample/helpers/get-example-from-schema'
import type { Param, PostData } from 'har-format'

import { getExampleValue } from './get-example-value'
import type { OperationToHarProps } from './operation-to-har'

type ProcessBodyProps = Pick<OperationToHarProps, 'contentType' | 'example'> & {
  requestBody: RequestBodyObject
}

/**
 * Converts an object to an array of form parameters
 * @param obj - The object to convert
 * @returns Array of form parameters with name and value properties
 */
const objectToFormParams = (obj: object): Param[] => {
  const params: Param[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      continue
    }

    // Handle arrays by adding each item with the same key
    if (Array.isArray(value)) {
      for (const item of value) {
        params.push({ name: key, value: String(item) })
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
 */
export const processBody = ({ requestBody, contentType, example }: ProcessBodyProps): PostData => {
  const _contentType = contentType || Object.keys(requestBody.content)[0] || ''

  // Check if this is a form data content type
  const isFormData = _contentType === 'multipart/form-data' || _contentType === 'application/x-www-form-urlencoded'

  // Check if this is an XML content type
  const isXml = _contentType === 'application/xml'

  // Get the example value
  const _example = getExampleValue(requestBody, example, contentType)

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
      text: JSON.stringify(_example),
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
        text: JSON.stringify(extractedExample),
      }
    }
  }

  return {
    mimeType: _contentType,
    text: 'null',
  }
}
