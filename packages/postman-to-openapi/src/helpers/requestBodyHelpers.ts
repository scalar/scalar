import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { FormParameter, RequestBody, UrlEncodedParameter } from '../types'
import { processFormDataSchema } from './formDataHelpers'
import { createParameterObject } from './parameterHelpers'

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

function handleRawBody(body: RequestBody, requestBody: OpenAPIV3_1.RequestBodyObject) {
  try {
    const jsonBody = JSON.parse(body.raw || '')
    requestBody.content = {
      'application/json': {
        schema: {
          type: 'object',
          example: jsonBody,
        },
      },
    }
  } catch (_error) {
    requestBody.content = {
      'text/plain': {
        schema: {
          type: 'string',
          examples: [body.raw],
        },
      },
    }
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
