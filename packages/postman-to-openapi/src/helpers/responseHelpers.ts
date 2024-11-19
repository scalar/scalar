import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { HeaderList, Response } from '../types'
import { inferSchemaFromExample } from './schemaHelpers'

/**
 * Extracts and converts Postman response objects to OpenAPI response objects.
 * Processes response status codes, descriptions, headers, and body content,
 * inferring schemas from example responses when possible.
 */
export function extractResponses(
  responses: Response[],
): OpenAPIV3_1.ResponsesObject {
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return { '200': { description: 'OK' } }
  }

  return responses.reduce((openapiResponses, response) => {
    const statusCode = response.code?.toString() || 'default'

    openapiResponses[statusCode] = {
      description: response.status || '',
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
    return openapiResponses
  }, {} as OpenAPIV3_1.ResponsesObject)
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
  } catch (e) {
    return { rawContent: jsonString }
  }
}
