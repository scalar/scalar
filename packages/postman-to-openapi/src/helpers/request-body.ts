import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { FormParameter, RequestBody, UrlEncodedParameter } from '@/types'

import { processFormDataSchema } from './form-data'
import { createParameterObject } from './parameters'

/**
 * Extracts and converts the request body from a Postman request to an OpenAPI RequestBodyObject.
 * Handles raw JSON, form-data, and URL-encoded body types, creating appropriate schemas and content types.
 *
 * When `contentType` is provided (already normalised via `parseMediaType`), it
 * wins over the Postman `options.raw.language` hint for `raw` bodies.
 * `formdata` and `urlencoded` modes keep their natural media types.
 */
export function extractRequestBody(
  body: RequestBody,
  exampleName: string,
  contentType?: string,
): OpenAPIV3_1.RequestBodyObject {
  const requestBody: OpenAPIV3_1.RequestBodyObject = {
    content: {},
  }

  if (body.mode === 'raw') {
    handleRawBody(body, requestBody, exampleName, contentType)
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

function handleRawBody(
  body: RequestBody,
  requestBody: OpenAPIV3_1.RequestBodyObject,
  exampleName: string,
  contentType: string | undefined,
): void {
  const rawBody = body.raw || ''
  const isJsonLanguage = body.options?.raw?.language === 'json'
  const mediaType = contentType ?? (isJsonLanguage ? 'application/json' : 'text/plain')

  if (mediaType === 'application/json') {
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

  if (mediaType === 'text/plain') {
    requestBody.content = {
      'text/plain': {
        schema: {
          type: 'string',
          examples: rawBody ? [rawBody] : undefined,
        },
      },
    }
    return
  }

  // Any other caller-declared media type (application/xml, text/csv, application/octet-stream, ...)
  requestBody.content = {
    [mediaType]: {
      schema: {
        type: 'string',
      },
      examples: {
        [exampleName]: {
          value: rawBody,
        },
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
