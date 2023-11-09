import type { HarRequestWithPath, TransformedOperation } from '../types'
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

  // Get all the information about the request body
  const jsonRequest =
    operation.information?.requestBody?.content?.['application/json'] || null

  // Headers
  const allHeaders = []

  if (jsonRequest) {
    allHeaders.push({
      name: 'Content-Type',
      value: 'application/json',
    })
  }

  // Prepare the data, if there’s any
  const schema = jsonRequest?.schema
  const requestBody = schema ? getExampleFromSchema(schema) : null
  const postData = requestBody
    ? {
        mimeType: 'application/json',
        text: JSON.stringify(requestBody, null, 2),
      }
    : undefined

  return {
    method: operation.httpVerb.toUpperCase(),
    path,
    headers: allHeaders,
    postData,
  }
}
