import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'

import { parseCurlCommand } from '@/libs'

/** Data parsing for request body */
function parseData(data: string): Record<string, any> {
  try {
    // Try parsing as JSON
    return JSON.parse(data)
  } catch {
    // If not JSON, assume it's form-encoded
    const result: Record<string, string> = {}
    data.split('&').forEach((pair) => {
      const [key, value] = pair.split('=')
      if (key && value) {
        result[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    })
    return result
  }
}

export const getOperationFromCurl = (
  curl: string,
  exampleKey = 'curl',
): {
  path: string
  method: HttpMethod
  operation: OperationObject
} => {
  const parsedCurl = parseCurlCommand(curl)

  const { method = 'get', url, body = '', headers = {}, servers = [], queryParameters = [] } = parsedCurl
  const path = new URL(url).pathname
  const contentType =
    body?.includes('=') && !body.startsWith('{') ? 'application/x-www-form-urlencoded' : headers['Content-Type'] || ''
  const requestBody = body ? parseData(body) : {}

  // Create parameters following request schema
  const parameters = [
    ...(Array.isArray(queryParameters)
      ? queryParameters.map(({ key, value }) => ({
          name: key,
          in: 'query' as const,
          schema: { type: typeof value },
          examples: {
            [exampleKey]: { value },
          },
        }))
      : []),
    ...Object.entries(headers || {}).map(([key, value]) => ({
      name: key,
      in: 'header' as const,
      schema: { type: typeof value },
      examples: {
        [exampleKey]: { value },
      },
    })),
  ] satisfies ParameterObject[]

  const serverObjects = servers.map((server) => ({
    url: server,
  })) satisfies ServerObject[]

  return {
    path,
    method,
    operation: {
      parameters,
      requestBody: {
        content: {
          [contentType]: {
            schema: {
              type: 'object',
              properties: Object.fromEntries(
                Object.entries(requestBody).map(([key, value]) => [key, { type: typeof value } as SchemaObject]),
              ),
            },
            examples: {
              [exampleKey]: { value: requestBody },
            },
          },
        },
        'x-scalar-selected-content-type': {
          [exampleKey]: contentType,
        },
      },
      servers: serverObjects.length ? serverObjects : undefined,
    },
  }
}
