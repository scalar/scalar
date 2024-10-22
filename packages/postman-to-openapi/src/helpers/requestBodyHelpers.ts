import type { OpenAPIV3 } from '@scalar/openapi-types'

import type {
  FormParameter,
  RequestBody,
  UrlEncodedParameter,
} from '../postman'

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

  if (body.mode === 'raw') {
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
  } else if (body.mode === 'formdata' && body.formdata) {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {},
    }
    body.formdata.forEach((item: FormParameter) => {
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
  } else if (body.mode === 'urlencoded' && body.urlencoded) {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {},
    }
    body.urlencoded.forEach((item: UrlEncodedParameter) => {
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
  return requestBody
}
