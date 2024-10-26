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
  const parameterMap: Map<string, OpenAPIV3.ParameterObject> = new Map()

  if (typeof request === 'string' || !request.url) {
    return parameters
  }

  const url =
    typeof request.url === 'string' ? { raw: request.url } : request.url

  // Process query parameters
  if (url.query) {
    url.query.forEach((param) => {
      const paramObj = createParameterObject(param, 'query')
      if (paramObj.name) {
        parameterMap.set(paramObj.name, paramObj)
      }
    })
  }

  // Process path parameters
  if (url.variable) {
    url.variable.forEach((param) => {
      const paramObj = createParameterObject(param, 'path')
      if (paramObj.name) {
        parameterMap.set(paramObj.name, paramObj)
      }
    })
  }

  // Include variables extracted from url.path array
  if (url.path) {
    const pathArray = Array.isArray(url.path) ? url.path : [url.path]
    const extractedVariables = extractPathVariablesFromPathArray(pathArray)
    extractedVariables.forEach((varName) => {
      if (!parameterMap.has(varName)) {
        parameterMap.set(varName, {
          name: varName,
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
        })
      }
    })
  }

  // Process header parameters
  if (request.header && Array.isArray(request.header)) {
    request.header.forEach((header: Header) => {
      const paramObj = createParameterObject(header, 'header')
      if (paramObj.name) {
        parameterMap.set(paramObj.name, paramObj)
      }
    })
  }

  return Array.from(parameterMap.values())
}

/**
 * Helper function to extract variables from the url.path array.
 */
function extractPathVariablesFromPathArray(
  pathArray: (string | { type: string; value: string })[],
): string[] {
  const variables: string[] = []
  const variableRegex = /{{\s*([\w.-]+)\s*}}/

  pathArray.forEach((segment) => {
    const segmentString = typeof segment === 'string' ? segment : segment.value
    const match = segmentString.match(variableRegex)
    if (match?.[1]) {
      variables.push(match[1])
    }
  })

  return variables
}

/**
 * Creates an OpenAPI parameter object from a Postman parameter.
 */
export function createParameterObject(
  param: any,
  paramIn: 'query' | 'path' | 'header',
): OpenAPIV3.ParameterObject {
  const parameter: OpenAPIV3.ParameterObject = {
    name: param.key || '',
    in: paramIn,
    description: param.description,
  }

  // Path parameters are always required in OpenAPI
  if (paramIn === 'path') {
    parameter.required = true
  } else if (paramIn === 'query') {
    // Check if the parameter is required based on description or name
    const isRequired =
      param.description?.toLowerCase().includes('[required]') ||
      (param.key && param.key.toLowerCase() === 'required')

    if (isRequired) {
      parameter.required = true
      // Remove '[required]' from the description
      if (parameter.description) {
        parameter.description = parameter.description
          .replace(/\[required\]/gi, '')
          .trim()
      }
    }
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
 * Infers the schema type from the parameter value.
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

  return { type: 'string' }
}
