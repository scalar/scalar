import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type {
  OperationObject,
  ParameterObject,
  SchemaObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { parseCurlCommand } from '@/libs'

/**
 * Represents the result of parsing a cURL command into an OpenAPI operation.
 */
type CurlOperationResult = {
  /** The URL path extracted from the cURL command. */
  path: string
  /** The HTTP method (GET, POST, etc.). */
  method: HttpMethod
  /** The OpenAPI operation object with parameters, body, and servers. */
  operation: OperationObject
}

/**
 * Represents data that can be either JSON or form-encoded key-value pairs.
 */
type ParsedData = Record<string, unknown>

/**
 * Parses request body data from a string.
 * Attempts JSON parsing first, then falls back to form-encoded parsing.
 *
 * Form-encoded data is expected in the format: key1=value1&key2=value2
 */
const parseRequestBodyData = (data: string): ParsedData => {
  try {
    // Try parsing as JSON first
    return JSON.parse(data) as ParsedData
  } catch {
    // If JSON parsing fails, parse as form-encoded data (key=value&key2=value2)
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

/**
 * Determines the content type based on the request body structure.
 * Returns form-encoded if the body looks like form data, JSON if the body looks like JSON,
 * otherwise uses the header value.
 */
const detectContentType = (body: string, headers: Record<string, string>): string => {
  // If Content-Type header is explicitly provided, use it
  if (headers['Content-Type']) {
    return headers['Content-Type']
  }

  // Check if body looks like JSON (starts with { or [)
  const trimmedBody = body.trim()
  const isJson = trimmedBody.startsWith('{') || trimmedBody.startsWith('[')

  if (isJson) {
    return 'application/json'
  }

  // Check if body looks like form-encoded data (contains = but does not start with {)
  const isFormEncoded = body.includes('=') && !trimmedBody.startsWith('{')

  return isFormEncoded ? 'application/x-www-form-urlencoded' : ''
}

/**
 * Infers a JSON Schema type from a JavaScript value.
 * Maps JavaScript typeof results to JSON Schema primitive types.
 */
const inferSchemaType = (value: unknown): string => {
  const jsType = typeof value

  // Map JavaScript types to JSON Schema types
  if (jsType === 'string') {
    return 'string'
  }
  if (jsType === 'number') {
    return 'number'
  }
  if (jsType === 'boolean') {
    return 'boolean'
  }
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  if (jsType === 'object') {
    return 'object'
  }

  // Default fallback for any other types
  return 'string'
}

/**
 * Creates query and header parameters from parsed cURL data.
 * Each parameter includes a schema with inferred type and an example value.
 */
const createParameters = (
  queryParameters: Array<{ key: string; value: string }>,
  headers: Record<string, string>,
  exampleKey: string,
): ParameterObject[] => {
  const queryParams = Array.isArray(queryParameters)
    ? queryParameters.map(({ key, value }) => ({
        name: key,
        in: 'query' as const,
        schema: { type: inferSchemaType(value) },
        examples: {
          [exampleKey]: { value },
        },
      }))
    : []

  const headerParams = Object.entries(headers || {}).map(([key, value]) => ({
    name: key,
    in: 'header' as const,
    schema: { type: inferSchemaType(value) },
    examples: {
      [exampleKey]: { value },
    },
  }))

  return [...queryParams, ...headerParams]
}

/**
 * Creates a request body schema from parsed data.
 * Generates an object schema with properties inferred from the data structure.
 */
const createRequestBodySchema = (data: ParsedData): SchemaObject => {
  const properties = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, { type: inferSchemaType(value) } as SchemaObject]),
  )

  return {
    type: 'object',
    properties,
  }
}

/** Don't want to throw for invalid URLs */
const safePathname = (url: string) => {
  try {
    return new URL(url).pathname
  } catch {
    return '/'
  }
}

/**
 * Converts a cURL command string into an OpenAPI operation object.
 *
 * This function parses a cURL command and extracts all relevant information
 * (path, method, headers, query parameters, request body) to create a complete
 * OpenAPI operation that can be used to populate a request in the API client.
 *
 * The exampleKey is used to namespace the example values in the operation object,
 * allowing multiple examples to coexist if needed.
 */
export const getOperationFromCurl = (curl: string, exampleKey = 'curl'): CurlOperationResult => {
  const parsedCurl = parseCurlCommand(curl)

  const { method = 'get', url, body = '', headers = {}, servers = [], queryParameters = [] } = parsedCurl

  const path = safePathname(url)
  const contentType = detectContentType(body, headers)
  const requestBodyData = body ? parseRequestBodyData(body) : {}

  const parameters = createParameters(queryParameters, headers, exampleKey)

  const serverObjects: ServerObject[] = servers.map((server) => ({
    url: server,
  }))

  return {
    path,
    method,
    operation: {
      parameters,
      requestBody: {
        content: {
          [contentType]: {
            schema: createRequestBodySchema(requestBodyData),
            examples: {
              [exampleKey]: { value: requestBodyData },
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
