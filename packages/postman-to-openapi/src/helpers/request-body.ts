import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { FormParameter, RequestBody, UrlEncodedParameter } from '@/types'

import { processFormDataSchema } from './form-data'
import { createParameterObject } from './parameters'

/**
 * Extracts and converts the request body from a Postman request to an OpenAPI RequestBodyObject.
 * Handles raw JSON, form-data, and URL-encoded body types, creating appropriate schemas and content types.
 */
export function extractRequestBody(body: RequestBody, exampleName: string): OpenAPIV3_1.RequestBodyObject {
  const requestBody: OpenAPIV3_1.RequestBodyObject = {
    content: {},
  }

  if (body.mode === 'raw') {
    handleRawBody(body, requestBody, exampleName)
    return requestBody
  }

  if (body.mode === 'formdata' && body.formdata) {
    handleFormDataBody(body.formdata, requestBody, exampleName)
    return requestBody
  }

  if (body.mode === 'urlencoded' && body.urlencoded) {
    handleUrlEncodedBody(body.urlencoded, requestBody, exampleName)
    return requestBody
  }

  return requestBody
}

function handleRawBody(body: RequestBody, requestBody: OpenAPIV3_1.RequestBodyObject, exampleName: string): void {
  const rawBody = body.raw || ''
  const isJsonLanguage = body.options?.raw?.language === 'json'

  // If we have valid JSON, use it
  if (isJsonLanguage) {
    requestBody.content = {
      'application/json': {
        schema: {
          type: 'object',
        },
        examples: {
          [exampleName]: {
            value: rawBody,
          },
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

function handleFormDataBody(
  formdata: FormParameter[],
  requestBody: OpenAPIV3_1.RequestBodyObject,
  exampleName: string,
): void {
  requestBody.content = {
    'multipart/form-data': {
      schema: processFormDataSchema(formdata),
      examples: {
        [exampleName]: {
          value: formdata,
        },
      },
    },
  }
}

function handleUrlEncodedBody(
  urlencoded: UrlEncodedParameter[],
  requestBody: OpenAPIV3_1.RequestBodyObject,
  exampleName: string,
): void {
  const schema: OpenAPIV3_1.SchemaObject = {
    type: 'object',
    properties: {},
    required: [],
  }
  urlencoded.forEach((item: UrlEncodedParameter) => {
    if (schema.properties) {
      const paramObject = createParameterObject(item, 'query', exampleName)
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
      examples: {
        [exampleName]: {
          value: urlencoded,
        },
      },
    },
  }
}
