import type {
  HarRequestWithPath,
  RequestBodyMimeTypes,
  TransformedOperation,
} from '../types'
import { getExampleFromSchema } from './getExampleFromSchema'
import { json2xml } from './json2xml'

export const getRequestFromOperation = (
  operation: TransformedOperation,
  options?: {
    replaceVariables?: boolean
  },
): Partial<HarRequestWithPath> => {
  // Replace all variables of the format {something} with the uppercase variable name without the brackets
  let path = operation.path

  if (options?.replaceVariables === true) {
    const pathVariables = path.match(/{(.*?)}/g)

    if (pathVariables) {
      pathVariables.forEach((variable) => {
        const variableName = variable.replace(/{|}/g, '')
        path = path.replace(variable, `__${variableName.toUpperCase()}__`)
      })
    }
  }

  const requestBody = getRequestBody(operation)

  return {
    method: operation.httpVerb.toUpperCase(),
    path,
    headers: requestBody?.headers,
    postData: requestBody?.postData,
  }
}

/**
 * Get the request body from the operation.
 */
function getRequestBody(operation: TransformedOperation) {
  // Define all supported mime types
  const mimeTypes: RequestBodyMimeTypes[] = [
    // TODO: 'multipart/form-data',
    // TODO: 'text/plain',
    'application/json',
    'application/x-www-form-urlencoded',
    'application/octet-stream',
    'application/xml',
  ]

  // Find the first mime type that is supported
  const mimeType: RequestBodyMimeTypes | undefined = mimeTypes.find(
    (currentMimeType) =>
      !!operation.information?.requestBody?.content?.[currentMimeType],
  )

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
  // TODO: Add support for given examples
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
}
