import type { ClientRequestConfig } from '@scalar/api-client'

import { type ParamMap } from '../hooks'
import type { Operation, Server } from '../types'
import { generateParameters } from './generateParameters'
import { getExampleFromSchema } from './getExampleFromSchema'

/**
 * Generate parameters for the request
 */
export function generateRequest(
  operation: Operation,
  parameterMap: ParamMap,
  server: Server,
): ClientRequestConfig {
  const schema =
    operation?.information.requestBody?.content['application/json']?.schema
  const body = schema
    ? JSON.stringify(getExampleFromSchema(schema), null, 2)
    : undefined

  let headers = generateParameters(parameterMap.header)

  if (body) {
    headers = headers.filter(
      (header) => header.name.toLowerCase() !== 'content-type',
    )

    headers.push({
      name: 'Content-Type',
      value: 'application/json',
    })
  }

  const item = {
    id: operation.operationId,
    name: operation.name,
    type: operation.httpVerb,
    path: operation.path,
    parameters: generateParameters(parameterMap.path),
    query: generateParameters(parameterMap.query),
    headers,
    url: server.url,
    body,
  }

  return item
}
