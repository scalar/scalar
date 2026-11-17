import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { FormParameter, RequestBody, UrlEncodedParameter } from '@/types'

import { addRequiredFormField, processFormDataSchema, setFormFieldSchema } from './form-data'
import { createParameterObject } from './parameters'

/**
 * Extracts and converts the request body from a Postman request to an OpenAPI RequestBodyObject.
 * Handles raw, GraphQL, file, form-data, and URL-encoded body types.
 *
 * When `contentType` is provided (already normalised via `parseMediaType`), it
 * wins over the Postman `options.raw.language` hint for `raw` bodies and the
 * default media type for GraphQL and file bodies.
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

  if (body.mode === 'graphql') {
    const variables = parseGraphqlVariables(body.graphql?.variables)
    requestBody.content = {
      [contentType ?? 'application/json']: {
        schema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            variables: { type: 'object' },
          },
          required: ['query'],
        },
        examples: {
          [exampleName]: {
            value: {
              query: body.graphql?.query ?? '',
              ...(variables !== undefined && { variables }),
            },
          },
        },
      },
    }
    return requestBody
  }

  if (body.mode === 'file') {
    // A local filename is not the uploaded content and must not become an example.
    requestBody.content = { [contentType ?? 'application/octet-stream']: {} }
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

/** Parses exported JSON variables while preserving unresolved templates or malformed input. */
const parseGraphqlVariables = (variables: NonNullable<RequestBody['graphql']>['variables']): unknown => {
  if (typeof variables !== 'string') {
    return variables
  }
  if (!variables.trim()) {
    return undefined
  }
  try {
    const parsed: unknown = JSON.parse(variables)
    return parsed
  } catch {
    return variables
  }
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

/** A form row in the shape the API client, request builder and code examples read, so imported fields keep their names. */
type FormRow = { name: string; value: string; isDisabled: boolean }

/** Keeps every Postman row in order, including repeated keys, and leaves file rows empty until a file is attached. */
const toFormRows = (rows: (FormParameter | UrlEncodedParameter)[]): FormRow[] =>
  rows.map(
    (row): FormRow => ({
      name: row.key,
      value: 'type' in row && row.type === 'file' ? '' : (row.value ?? ''),
      isDisabled: row.disabled === true,
    }),
  )

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
          value: toFormRows(formdata),
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
        examples: [item.value ?? ''],
        description: paramObject.description,
      }
      // Add x-scalar-disabled extension if parameter is disabled
      if (item.disabled === true) {
        property['x-scalar-disabled'] = true
      }
      setFormFieldSchema(schema.properties, item.key, property)
      if (paramObject.required && schema.required) {
        addRequiredFormField(schema.required, item.key)
      }
    }
  })
  requestBody.content = {
    'application/x-www-form-urlencoded': {
      schema,
      examples: {
        [exampleName]: {
          value: toFormRows(urlencoded),
        },
      },
    },
  }
}
