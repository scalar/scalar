import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { HeaderList, Item, Response } from '@/types'

import { inferSchemaFromExample } from './schemas'
import { extractStatusCodesFromTests } from './status-codes'

export const DEFAULT_RESPONSE_DESCRIPTIONS: Record<string, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No content',
  301: 'Moved permanently',
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  422: 'Unprocessable entity',
  500: 'Internal server error',
  default: 'Default response',
}

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
      description: getResponseDescription(response, statusCode),
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
        description: getDefaultResponseDescription(codeStr),
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

function getResponseDescription(response: Response, statusCode: string): string {
  const descriptionFromName = extractDescriptionFromName(response.name, statusCode)
  if (descriptionFromName) {
    return descriptionFromName
  }

  if (response.status) {
    return response.status
  }

  return getDefaultResponseDescription(statusCode)
}

function extractDescriptionFromName(name: string | undefined, statusCode: string): string | undefined {
  if (!name) {
    return undefined
  }

  const trimmedName = name.trim()
  const separatorIndex = trimmedName.indexOf('-')
  if (separatorIndex < 0) {
    return undefined
  }

  const code = trimmedName.slice(0, separatorIndex).trim()
  if (!isThreeDigitStatusCode(code) || code !== statusCode) {
    return undefined
  }

  const description = trimmedName.slice(separatorIndex + 1).trim()
  if (!description) {
    return undefined
  }

  return description
}

function getDefaultResponseDescription(statusCode: string): string {
  return DEFAULT_RESPONSE_DESCRIPTIONS[statusCode] ?? DEFAULT_RESPONSE_DESCRIPTIONS.default ?? 'Default response'
}

function isThreeDigitStatusCode(value: string): boolean {
  if (value.length !== 3) {
    return false
  }

  for (const character of value) {
    if (character < '0' || character > '9') {
      return false
    }
  }

  return true
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
