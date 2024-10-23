import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { Header, Request } from '../types'

/**
 * Extracts parameters from a Postman request and converts them to OpenAPI parameter objects.
 * Processes query, path, and header parameters from the request URL and headers.
 */
export function extractParameters(
  request: Request,
): OpenAPIV3.ParameterObject[] {
  const parameters: OpenAPIV3.ParameterObject[] = []

  if (typeof request === 'string' || !request.url) {
    return parameters
  }

  const url =
    typeof request.url === 'string' ? { raw: request.url } : request.url

  // Process query parameters
  if (url.query) {
    url.query.forEach((param) => {
      parameters.push(createParameterObject(param, 'query'))
    })
  }

  // Process path parameters
  if (url.variable) {
    url.variable.forEach((param) => {
      parameters.push(createParameterObject(param, 'path'))
    })
  }

  // Process header parameters
  if (request.header && Array.isArray(request.header)) {
    request.header.forEach((header: Header) => {
      parameters.push(createParameterObject(header, 'header'))
    })
  }

  return parameters
}

/**
 * Creates an OpenAPI parameter object from a Postman parameter.
 */
function createParameterObject(
  param: any,
  paramIn: 'query' | 'path' | 'header',
): OpenAPIV3.ParameterObject {
  const parameter: OpenAPIV3.ParameterObject = {
    name: param.key,
    in: paramIn,
    description: param.description,
  }

  // Path parameters are always required in OpenAPI
  if (paramIn === 'path') {
    parameter.required = true
  }

  if (param.value !== undefined) {
    parameter.example = param.value
    parameter.schema = inferSchemaType(param.value)
  } else {
    parameter.schema = { type: 'string' } // Default to string if no value is provided
  }

  return parameter
}

/**
 * Infers the OpenAPI schema type based on the parameter value.
 */
function inferSchemaType(value: any): OpenAPIV3.SchemaObject {
  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' }
  } else if (typeof value === 'boolean') {
    return { type: 'boolean' }
  } else if (typeof value === 'string') {
    // Try to parse as number
    const num = Number(value)
    if (!isNaN(num)) {
      return { type: Number.isInteger(num) ? 'integer' : 'number' }
    }
    // Try to parse as boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return { type: 'boolean' }
    }
  }
  // Default to string for all other cases
  return { type: 'string' }
}
