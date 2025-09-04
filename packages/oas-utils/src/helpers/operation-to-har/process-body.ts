import { getExampleFromSchema } from '@/spec-getters/get-example-from-schema'
import { json2xml } from '@scalar/helpers/file/json2xml'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Param, PostData } from 'har-format'
import type { OperationToHarProps } from './operation-to-har'

type ProcessBodyProps = Pick<OperationToHarProps, 'contentType' | 'example'> & {
  content: RequestBodyObject['content']
}

/**
 * Converts an object to an array of form parameters
 * @param obj - The object to convert
 * @returns Array of form parameters with name and value properties
 */
const objectToFormParams = (obj: Record<string, unknown>): Param[] => {
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
      const nestedParams = objectToFormParams(value as Record<string, unknown>)

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
export const processBody = ({ content, contentType, example }: ProcessBodyProps): PostData => {
  const _contentType = (contentType || Object.keys(content)[0]) ?? ''

  // Check if this is a form data content type
  const isFormData = _contentType === 'multipart/form-data' || _contentType === 'application/x-www-form-urlencoded'

  // Check if this is an XML content type
  const isXml = _contentType === 'application/xml'

  // Return the provided top level example
  if (example) {
    if (isFormData && typeof example === 'object' && example !== null) {
      return {
        mimeType: _contentType,
        params: objectToFormParams(example as Record<string, unknown>),
      }
    }

    if (isXml && typeof example === 'object' && example !== null) {
      return {
        mimeType: _contentType,
        text: json2xml(example as Record<string, unknown>),
      }
    }

    return {
      mimeType: _contentType,
      text: JSON.stringify(example),
    }
  }

  // Try to extract examples from the schema
  const contentSchema = getResolvedRef(content[_contentType]?.schema)
  if (contentSchema) {
    const extractedExample = getExampleFromSchema(contentSchema, {
      mode: 'write',
      xml: isXml,
    })

    if (extractedExample !== undefined) {
      if (isFormData && typeof extractedExample === 'object' && extractedExample !== null) {
        return {
          mimeType: _contentType,
          params: objectToFormParams(extractedExample as Record<string, unknown>),
        }
      }

      if (isXml && typeof extractedExample === 'object' && extractedExample !== null) {
        return {
          mimeType: _contentType,
          text: json2xml(extractedExample as Record<string, unknown>),
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
