import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { HeaderList, Item, Response } from '../types'
import { inferSchemaFromExample } from './schemaHelpers'
import { extractStatusCodesFromTests } from './statusCodeHelpers'

/**
 * Extracts and converts Postman response objects to OpenAPI response objects.
 * Processes response status codes, descriptions, headers, and body content,
 * inferring schemas from example responses when possible.
 */
export function extractResponses(responses: Response[], item?: Item): OpenAPIV3_1.ResponsesObject | undefined {
  // Extract status codes from tests
  const statusCodes = item ? extractStatusCodesFromTests(item) : []

  // Create a map of status codes to descriptions from responses
  const responseMap = responses.reduce((acc, response) => {
    const statusCode = response.code?.toString() || 'default'
    acc[statusCode] = {
      description: response.status || 'Successful response',
      headers: extractHeaders(response.header),
      content: {
        'application/json': {
          schema: inferSchemaFromExample(response.body || ''),
          examples: {
            default: tryParseJson(response.body || ''),
          },
        },
      },
    }
    return acc
  }, {} as OpenAPIV3_1.ResponsesObject)

  // Add status codes from tests if not already present
  statusCodes.forEach((code) => {
    const codeStr = code.toString()
    if (!responseMap[codeStr]) {
      responseMap[codeStr] = {
        description: 'Successful response',
        content: {
          'application/json': {},
        },
      }
    }
  })

  if (Object.keys(responseMap).length === 0) {
    return undefined
  }

  return responseMap
}

function extractHeaders(
  headers: HeaderList | string | null | undefined,
): { [key: string]: OpenAPIV3_1.HeaderObject } | undefined {
  if (!headers || typeof headers === 'string') {
    return undefined
  }
  const openapiHeaders: { [key: string]: OpenAPIV3_1.HeaderObject } = {}
  if (Array.isArray(headers)) {
    headers.forEach((header) => {
      openapiHeaders[header.key] = {
        schema: {
          type: 'string',
          examples: [header.value],
        },
      }
    })
  }
  return openapiHeaders
}

function tryParseJson(jsonString: string): Record<string, unknown> {
  try {
    return JSON.parse(jsonString) as Record<string, unknown>
  } catch (_e) {
    return { rawContent: jsonString }
  }
}
