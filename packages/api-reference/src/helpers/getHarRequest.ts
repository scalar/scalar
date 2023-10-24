import { type HarRequest } from 'httpsnippet-lite'

import type { TransformedOperation } from '../types'
import { getExampleFromSchema } from './getExampleFromSchema'

export type Header = { name: string; value: string }

export const getHarRequest = ({
  url,
  operation,
  additionalHeaders,
}: {
  url: string
  operation: TransformedOperation
  additionalHeaders?: Header[]
}): HarRequest => {
  // Replace all variables of the format {something} with the uppercase variable name without the brackets
  let path = operation.path

  const pathVariables = path.match(/{(.*?)}/g)

  if (pathVariables) {
    pathVariables.forEach((variable) => {
      const variableName = variable.replace(/{|}/g, '')
      path = path.replace(variable, `__${variableName.toUpperCase()}__`)
    })
  }

  // Get all the information about the request body
  const jsonRequest =
    operation.information?.requestBody?.content['application/json'] || null

  // Headers
  let headers = []

  if (jsonRequest) {
    headers.push({
      name: 'Content-Type',
      value: 'application/json',
    })
  }

  headers = [...headers, ...(additionalHeaders ?? [])]

  // Prepare the data, if there’s any
  const schema = jsonRequest?.schema
  const requestBody = schema ? getExampleFromSchema(schema) : null

  const postData = requestBody
    ? {
        mimeType: 'application/json',
        text: JSON.stringify(requestBody, null, 2),
      }
    : null

  return {
    method: operation.httpVerb.toUpperCase(),
    url: `${url}${path}`,
    headers,
    // postData,
  }
}
