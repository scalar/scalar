import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { FormParameter, RequestBody, UrlEncodedParameter } from '../types'

/**
 * Extracts and converts the request body from a Postman request to an OpenAPI RequestBodyObject.
 * Handles raw JSON, form-data, and URL-encoded body types, creating appropriate schemas and content types.
 */
export function extractRequestBody(
  body: RequestBody,
): OpenAPIV3.RequestBodyObject {
  const requestBody: OpenAPIV3.RequestBodyObject = {
    content: {},
  }

  switch (body.mode) {
    case 'raw':
      handleRawBody(body, requestBody)
      break
    case 'formdata':
      if (body.formdata) {
        handleFormDataBody(body.formdata, requestBody)
      }
      break
    case 'urlencoded':
      if (body.urlencoded) {
        handleUrlEncodedBody(body.urlencoded, requestBody)
      }
      break
  }

  return requestBody
}

function handleRawBody(
  body: RequestBody,
  requestBody: OpenAPIV3.RequestBodyObject,
) {
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
  } catch (error) {
    requestBody.content = {
      'text/plain': {
        schema: {
          type: 'string',
          example: body.raw,
        },
      },
    }
  }
}

function handleFormDataBody(
  formdata: FormParameter[],
  requestBody: OpenAPIV3.RequestBodyObject,
) {
  const schema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {},
  }
  formdata.forEach((item: FormParameter) => {
    if (schema.properties) {
      schema.properties[item.key] = {
        type: 'string',
        example: item.type === 'file' ? 'file content' : item.value,
      }
    }
  })
  requestBody.content = {
    'multipart/form-data': {
      schema,
    },
  }
}

function handleUrlEncodedBody(
  urlencoded: UrlEncodedParameter[],
  requestBody: OpenAPIV3.RequestBodyObject,
) {
  const schema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {},
  }
  urlencoded.forEach((item: UrlEncodedParameter) => {
    if (schema.properties) {
      schema.properties[item.key] = {
        type: 'string',
        example: item.value,
      }
    }
  })
  requestBody.content = {
    'application/x-www-form-urlencoded': {
      schema,
    },
  }
}
