import { parseCurlCommand } from '@/libs/parse-curl'

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
      result[decodeURIComponent(key)] = decodeURIComponent(value)
    })
    return result
  }
}

/** Make a usable object from a curl command to create a request */
export function importCurlCommand(curlCommand: string): object {
  const parsedCommand = parseCurlCommand(curlCommand)
  const {
    method,
    url,
    body = '',
    headers = {},
    servers,
    queryParameters,
  } = parsedCommand
  const path = new URL(url).pathname
  const contentType =
    body?.includes('=') && !body.startsWith('{')
      ? 'application/x-www-form-urlencoded'
      : headers['Content-Type'] || 'application/json'
  const requestBody = body ? parseData(body) : {}

  return {
    method,
    url,
    path,
    headers,
    servers: servers,
    queryParameters: queryParameters,
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
    ...(Object.keys(headers).length > 0 && {
      parameters: Object.entries(headers).map(([key, value]) => ({
        name: key,
        in: 'header',
        schema: {
          type: 'string',
        },
        example: value,
      })),
    }),
  }
}
