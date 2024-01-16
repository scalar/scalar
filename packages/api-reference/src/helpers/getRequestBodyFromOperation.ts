import { mergeAllObjects } from '../helpers'
import type { ContentType, TransformedOperation } from '../types'
import {
  getExampleFromSchema,
  getParametersFromOperation,
  json2xml,
  prettyPrintJson,
} from './'

/**
 * Get the request body from the operation.
 */
export function getRequestBodyFromOperation(operation: TransformedOperation) {
  // Define all supported mime types
  const mimeTypes: ContentType[] = [
    'application/json',
    'application/octet-stream',
    'application/x-www-form-urlencoded',
    'application/xml',
    'multipart/form-data',
    'text/plain',
  ]

  // Find the first mime type that is supported
  const mimeType: ContentType | undefined = mimeTypes.find(
    (currentMimeType: ContentType) =>
      !!operation.information?.requestBody?.content?.[currentMimeType],
  )

  // TODO:
  // * Add support for formData

  const bodyParameters = getParametersFromOperation(operation, 'body', false)

  if (bodyParameters.length > 0) {
    const allBodyParameters = mergeAllObjects(
      bodyParameters.map(
        (parameter) => parameter.value as Record<string, any>[],
      ),
    )

    return {
      postData: {
        mimeType: 'application/json',
        text: prettyPrintJson(allBodyParameters),
      },
    }
  }

  // If no mime type is supported, exit early
  if (!mimeType) {
    return null
  }

  // Get the request body object for the mime type
  const requestBodyObject =
    operation.information?.requestBody?.content?.[mimeType]

  // Define the appropriate Content-Type headers
  const headers = [
    {
      name: 'Content-Type',
      value: mimeType,
    },
  ]

  // Get example from operation
  const example = requestBodyObject?.example
    ? requestBodyObject?.example
    : undefined

  // JSON
  if (mimeType === 'application/json') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema)
      : null

    return {
      headers,
      postData: {
        mimeType: mimeType,
        text: example ?? JSON.stringify(exampleFromSchema, null, 2),
      },
    }
  }

  // XML
  if (mimeType === 'application/xml') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema, {
          xml: true,
        })
      : null

    return {
      headers,
      postData: {
        mimeType: mimeType,
        text: example ?? json2xml(exampleFromSchema, '  '),
      },
    }
  }

  // Binary data
  if (mimeType === 'application/octet-stream') {
    return {
      headers,
      postData: {
        mimeType: mimeType,
        text: 'BINARY',
      },
    }
  }

  // Plain text
  if (mimeType === 'text/plain') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema, {
          xml: true,
        })
      : null

    return {
      headers,
      postData: {
        mimeType: mimeType,
        text: example ?? exampleFromSchema ?? '',
      },
    }
  }

  // URL encoded data
  if (mimeType === 'application/x-www-form-urlencoded') {
    return {
      headers,
      postData: {
        mimeType: mimeType,
        // TODO: We have an object, but how do we get that kind of array from the object?
        // Don’t forget to include nested properties … :|
        // params: [
        //   {
        //     name: 'foo',
        //     value: 'bar',
        //   },
        // ],
      },
    }
  }

  // URL encoded data
  if (mimeType === 'multipart/form-data') {
    return {
      headers,
      postData: {
        mimeType: mimeType,
        // TODO: We have an object, but how do we get that kind of array from the object?
        // Don’t forget to include nested properties … :|
        // params: [
        //   {
        //     name: 'foo',
        //     value: 'bar',
        //   },
        // ],
      },
    }
  }

  return undefined
}
