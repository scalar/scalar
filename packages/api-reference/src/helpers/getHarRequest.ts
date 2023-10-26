import type { HarRequest } from 'httpsnippet-lite'

import type { Cookie, Header, Query, TransformedOperation } from '../types'
import { getExampleFromSchema } from './getExampleFromSchema'

export const getHarRequest = ({
  url,
  operation,
  headers,
  queryString,
  cookies,
}: {
  url: string
  operation: TransformedOperation
  headers?: Header[]
  queryString?: Query[]
  cookies?: Cookie[]
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
  let allHeaders = []

  if (jsonRequest) {
    allHeaders.push({
      name: 'Content-Type',
      value: 'application/json',
    })
  }

  allHeaders = [...allHeaders, ...(headers ?? [])]

  // Prepare the data, if there’s any
  // const schema = jsonRequest?.schema
  // const requestBody = schema ? getExampleFromSchema(schema) : null

  // const postData = requestBody
  //   ? {
  //       mimeType: 'application/json',
  //       text: JSON.stringify(requestBody, null, 2),
  //     }
  //   : null

  return {
    method: operation.httpVerb.toUpperCase(),
    url: `${url}${path}`,
    headers: allHeaders,
    queryString: queryString ?? [],
    cookies: cookies ?? [],
    httpVersion: '1.1',
    headersSize: -1,
    bodySize: -1,
  }
}
