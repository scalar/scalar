import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { FormParameter, RequestBody, UrlEncodedParameter } from '../types'
import { processFormDataSchema } from './form-data'
import { createParameterObject } from './parameters'

/**
 * Extracts and converts the request body from a Postman request to an OpenAPI RequestBodyObject.
 * Handles raw JSON, form-data, and URL-encoded body types, creating appropriate schemas and content types.
 */
export function extractRequestBody(
  body: RequestBody,
  preRequestScript?: string[] | string,
): OpenAPIV3_1.RequestBodyObject {
  const requestBody: OpenAPIV3_1.RequestBodyObject = {
    content: {},
  }

  if (body.mode === 'raw') {
    handleRawBody(body, requestBody, preRequestScript)
    return requestBody
  }

  if (body.mode === 'formdata' && body.formdata) {
    handleFormDataBody(body.formdata, requestBody)
    return requestBody
  }

  if (body.mode === 'urlencoded' && body.urlencoded) {
    handleUrlEncodedBody(body.urlencoded, requestBody)
    return requestBody
  }

  return requestBody
}

/**
 * Extracts JSON from pre-request script that sets bodyData via JSON.stringify
 * Handles multi-line JSON.stringify calls by finding the opening brace after JSON.stringify(
 * and matching it with the corresponding closing brace before the closing parenthesis
 */
function extractJsonFromPreRequestScript(script: string[] | string | undefined): any | null {
  if (!script) {
    return null
  }

  const scriptLines = Array.isArray(script) ? script : [script]
  const scriptText = scriptLines.join('\n')

  // Look for JSON.stringify( pattern
  const stringifyIndex = scriptText.indexOf('JSON.stringify(')
  if (stringifyIndex === -1) {
    return null
  }

  // Find the opening brace after JSON.stringify(
  const afterStringify = scriptText.substring(stringifyIndex + 'JSON.stringify('.length)
  const openBraceIndex = afterStringify.indexOf('{')
  if (openBraceIndex === -1) {
    return null
  }

  // Find the matching closing brace
  let braceCount = 0
  const jsonStart = openBraceIndex
  let jsonEnd = -1

  for (let i = openBraceIndex; i < afterStringify.length; i++) {
    const char = afterStringify[i]
    if (char === '{') {
      braceCount++
    } else if (char === '}') {
      braceCount--
      if (braceCount === 0) {
        jsonEnd = i + 1
        break
      }
    }
  }

  if (jsonEnd === -1) {
    return null
  }

  // Extract the JSON string
  const jsonString = afterStringify.substring(jsonStart, jsonEnd)

  try {
    return JSON.parse(jsonString)
  } catch {
    // If direct parsing fails, try to clean up the string (remove comments, etc.)
    // But for now, just return null if parsing fails
    return null
  }
}

function handleRawBody(
  body: RequestBody,
  requestBody: OpenAPIV3_1.RequestBodyObject,
  preRequestScript?: string[] | string,
) {
  const rawBody = body.raw || ''
  const isJsonLanguage = body.options?.raw?.language === 'json'

  // Check if body contains Postman variables (like {{bodyData}})
  const hasVariables = /\{\{[\w-]+\}\}/.test(rawBody)

  // Try to extract JSON from pre-request script if body has variables
  let jsonBody: any | null = null
  if (hasVariables && preRequestScript) {
    jsonBody = extractJsonFromPreRequestScript(preRequestScript)
  }

  // If we didn't get JSON from script, try parsing the raw body directly
  if (jsonBody === null) {
    try {
      jsonBody = JSON.parse(rawBody)
    } catch {
      // Parsing failed - will handle below
    }
  }

  // If we have valid JSON (from script or raw body), use it
  if (jsonBody !== null) {
    requestBody.content = {
      'application/json': {
        schema: {
          type: 'object',
          example: jsonBody,
        },
      },
    }
    return
  }

  // If we have variables and JSON language but couldn't extract/parse JSON,
  // create a JSON schema placeholder
  if (hasVariables && isJsonLanguage) {
    requestBody.content = {
      'application/json': {
        schema: {
          type: 'object',
          description: 'Body data set via pre-request script',
        },
      },
    }
    return
  }

  // Fallback to text/plain
  requestBody.content = {
    'text/plain': {
      schema: {
        type: 'string',
        examples: rawBody ? [rawBody] : undefined,
      },
    },
  }
}

function handleFormDataBody(formdata: FormParameter[], requestBody: OpenAPIV3_1.RequestBodyObject) {
  requestBody.content = {
    'multipart/form-data': {
      schema: processFormDataSchema(formdata),
    },
  }
}

function handleUrlEncodedBody(urlencoded: UrlEncodedParameter[], requestBody: OpenAPIV3_1.RequestBodyObject) {
  const schema: OpenAPIV3_1.SchemaObject = {
    type: 'object',
    properties: {},
    required: [],
  }
  urlencoded.forEach((item: UrlEncodedParameter) => {
    if (schema.properties) {
      const paramObject = createParameterObject(item, 'query')
      schema.properties[item.key] = {
        type: 'string',
        examples: [item.value],
        description: paramObject.description,
      }
      if (paramObject.required) {
        schema.required?.push(item.key)
      }
    }
  })
  requestBody.content = {
    'application/x-www-form-urlencoded': {
      schema,
    },
  }
}
