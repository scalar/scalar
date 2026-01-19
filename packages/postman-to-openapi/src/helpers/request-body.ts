import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { FormParameter, RequestBody, UrlEncodedParameter } from '@/types'

import { processFormDataSchema } from './form-data'
import { createParameterObject } from './parameters'

/**
 * Extracts and converts the request body from a Postman request to an OpenAPI RequestBodyObject.
 * Handles raw JSON, form-data, and URL-encoded body types, creating appropriate schemas and content types.
 */
export function extractRequestBody(body: RequestBody): OpenAPIV3_1.RequestBodyObject {
  const requestBody: OpenAPIV3_1.RequestBodyObject = {
    content: {},
  }

  if (body.mode === 'raw') {
    handleRawBody(body, requestBody)
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

function handleRawBody(body: RequestBody, requestBody: OpenAPIV3_1.RequestBodyObject): void {
  const rawBody = body.raw || ''
  const isJsonLanguage = body.options?.raw?.language === 'json'

  // Check if body contains Postman variables (like {{bodyData}})
  const hasVariables = /\{\{[\w-]+\}\}/.test(rawBody)

  // Try parsing the raw body as JSON
  // We use a boolean flag because `null` is a valid JSON value
  let jsonBody: unknown
  let isJsonBody = false
  try {
    jsonBody = JSON.parse(rawBody)
    isJsonBody = true
  } catch {
    // Parsing failed - will handle below
  }

  // If we have valid JSON, use it
  if (isJsonBody) {
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

  // If we have variables and JSON language but could not parse JSON,
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

function handleFormDataBody(formdata: FormParameter[], requestBody: OpenAPIV3_1.RequestBodyObject): void {
  requestBody.content = {
    'multipart/form-data': {
      schema: processFormDataSchema(formdata),
    },
  }
}

function handleUrlEncodedBody(urlencoded: UrlEncodedParameter[], requestBody: OpenAPIV3_1.RequestBodyObject): void {
  const schema: OpenAPIV3_1.SchemaObject = {
    type: 'object',
    properties: {},
    required: [],
  }
  urlencoded.forEach((item: UrlEncodedParameter) => {
    if (schema.properties) {
      const paramObject = createParameterObject(item, 'query')
      const property: OpenAPIV3_1.SchemaObject = {
        type: 'string',
        examples: [item.value],
        description: paramObject.description,
      }
      // Add x-scalar-disabled extension if parameter is disabled
      if (item.disabled === true) {
        property['x-scalar-disabled'] = true
      }
      schema.properties[item.key] = property
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
