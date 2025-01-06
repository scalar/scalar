import { parseCurlCommand } from '@/libs/parse-curl'
import type {
  Request,
  RequestMethod,
  RequestParameterPayload,
} from '@scalar/oas-utils/entities/spec'

/** Define curlCommandResult type */
type CurlCommandResult = {
  method: RequestMethod
  url: string
  path: string
  headers: Record<string, string>
  servers?: Array<string>
  requestBody?: {
    content: {
      [contentType: string]: {
        schema: {
          type: string
          properties: Record<string, { type: string }>
        }
        example: Record<string, string>
      }
    }
  }
  parameters: RequestParameterPayload[]
}

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

/** Make a usable object from a curl command to create a request */
export function importCurlCommand(curlCommand: string): CurlCommandResult {
  const parsedCommand = parseCurlCommand(curlCommand)
  const {
    method = 'get',
    url,
    body = '',
    headers = {},
    servers,
    queryParameters = [],
  } = parsedCommand
  const path = new URL(url).pathname
  const contentType =
    body?.includes('=') && !body.startsWith('{')
      ? 'application/x-www-form-urlencoded'
      : headers['Content-Type'] || 'application/json'
  const requestBody = body ? parseData(body) : {}

  // Create parameters following request schema
  const parameters = [
    ...(Array.isArray(queryParameters)
      ? queryParameters.map(({ key, value }) => ({
          name: key,
          in: 'query',
          schema: { type: typeof value, examples: [value] },
        }))
      : []),
    ...Object.entries(headers || {}).map(([key, value]) => ({
      name: key,
      in: 'header',
      schema: { type: typeof value },
      example: value,
    })),
  ] as RequestParameterPayload[]

  return {
    method,
    url,
    path,
    headers,
    servers: servers,
    ...(Object.keys(requestBody).length > 0 && {
      requestBody: {
        content: {
          [contentType]: {
            schema: {
              type: 'object',
              properties: Object.fromEntries(
                Object.entries(requestBody).map(([key, value]) => [
                  key,
                  { type: typeof value },
                ]),
              ),
            },
            example: requestBody,
          },
        },
      },
    }),
    parameters,
  }
}

/** Convert path string like '/planets/{planetId}' to regex pattern /\/planets/([^/]+)/ */
export const pathToRegex = (path: string) => {
  const regxStr =
    '^' + // start anchor
    path
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape special regex chars
      .replace(/\\\{([^}]+)\\\}/g, '([^/]+)') + // replace {param} with capture group
    '$' // end anchor

  return new RegExp(regxStr)
}

/**
 * Takes in a curl string and an array of requests and tries to match via method + path including
 * path params via regex
 */
export const matchCurlToRequest = (
  curlCommand: string,
  requests: Request[],
) => {
  const { method = 'get', url } = parseCurlCommand(curlCommand)
  const escapedPath = new URL(url).pathname
  const path = decodeURIComponent(escapedPath)

  return requests.find((r) => {
    if (r.method !== method) return false
    if (r.path === path) return true

    const regex = pathToRegex(r.path)
    const match = path.match(regex)
    if (match) return true

    return false
  })
}
