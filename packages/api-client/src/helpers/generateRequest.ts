import { type ParamMap } from '../hooks/useOperation'
import type { ClientRequestConfig, Operation, Server } from '../types'
import { generateParameters } from './generateParameters'
import { getRequestBody } from './generateRequestBody'

/**
 * Generate parameters for the request
 */
export function generateRequest(
  operation: Operation,
  parameterMap: ParamMap,
  server: Server,
): ClientRequestConfig {
  const item = {
    id: operation.operationId,
    name: operation.name,
    type: operation.httpVerb,
    path: operation.path,
    parameters: generateParameters(parameterMap.path),
    query: generateParameters(parameterMap.query),
    headers: generateParameters(parameterMap.header),
    url: server.url,
    body: getRequestBody(operation?.information?.requestBody),
  }

  return item
}
