import type {
  HarRequestWithPath,
  RequestBodyMimeTypes,
  TransformedOperation,
} from '../types'
import { getExampleFromSchema } from './getExampleFromSchema'

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
    'application/json',
    'application/x-www-form-urlencoded',
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
  const example = requestBodyObject?.schema
    ? getExampleFromSchema(requestBodyObject?.schema)
    : null

  return {
    headers,
    postData: {
      mimeType: mimeType,
      text: example,
    },
  }
}
