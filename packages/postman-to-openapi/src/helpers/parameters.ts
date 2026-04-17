import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Header, Request } from '@/types'

import { inferSchemaType } from './schemas'

/**
 * Header keys (lower-case) that never become `parameters[in=header]` on an
 * OpenAPI operation. They either describe the transport (Host, Connection),
 * overlap with `requestBody.content` / `responses.content` (Accept,
 * Content-Type), or belong in `components.securitySchemes` (Authorization,
 * Cookie). Callers can opt a specific name back in via `ConvertOptions.keepHeaders`.
 */
const BLOCKED_HEADERS: ReadonlySet<string> = new Set([
  // Content negotiation
  'accept',
  'accept-encoding',
  'accept-language',
  'content-type',
  // Transport / hop-by-hop
  'connection',
  'content-length',
  'host',
  'transfer-encoding',
  // Auth — belong in components.securitySchemes
  'authorization',
  'cookie',
  'proxy-authorization',
])

function isBlockedHeader(name: string | undefined, keepHeaders: readonly string[] | undefined): boolean {
  if (!name) {
    return false
  }
  const lower = name.toLowerCase()
  if (keepHeaders?.some((kept) => kept.toLowerCase() === lower)) {
    return false
  }
  return BLOCKED_HEADERS.has(lower)
}

/**
 * Extracts parameters from a Postman request and converts them to OpenAPI parameter objects.
 * Processes query, path, and header parameters from the request URL and headers.
 *
 * Headers on the built-in block-list (content negotiation, transport, auth) are
 * dropped unless the caller passes them via `keepHeaders` (case-insensitive).
 */
export function extractParameters(
  request: Request,
  exampleName: string,
  keepHeaders?: readonly string[],
): OpenAPIV3_1.ParameterObject[] {
  const parameters: OpenAPIV3_1.ParameterObject[] = []
  const parameterMap: Map<string, OpenAPIV3_1.ParameterObject> = new Map()

  if (typeof request === 'string' || !request.url) {
    return parameters
  }

  const url = typeof request.url === 'string' ? { raw: request.url } : request.url

  // Process query parameters
  if (url.query) {
    url.query.forEach((param) => {
      const paramObj = createParameterObject(param, 'query', exampleName)
      if (paramObj.name) {
        parameterMap.set(paramObj.name, paramObj)
      }
    })
  }

  // Process path parameters
  if (url.variable) {
    url.variable.forEach((param) => {
      const paramObj = createParameterObject(param, 'path', exampleName)
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
      if (isBlockedHeader(header.key, keepHeaders)) {
        return
      }
      const paramObj = createParameterObject(header, 'header', exampleName)
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
function extractPathVariablesFromPathArray(pathArray: (string | { type: string; value: string })[]): string[] {
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
  exampleName: string,
): OpenAPIV3_1.ParameterObject {
  const parameter: OpenAPIV3_1.ParameterObject = {
    name: param.key || '',
    in: paramIn,
    description: param.description,
    examples: {
      [exampleName]: {
        value: param.value,
        'x-disabled': !!param.disabled,
      },
    },
  }

  // Path parameters are always required in OpenAPI
  if (paramIn === 'path') {
    parameter.required = true
  } else if (paramIn === 'query') {
    // Check if the parameter is required based on description or name
    const isRequired =
      param.description?.toLowerCase().includes('[required]') || (param.key && param.key.toLowerCase() === 'required')

    if (isRequired) {
      parameter.required = true
      // Remove '[required]' from the description
      if (parameter.description) {
        parameter.description = parameter.description.replace(/\[required\]/gi, '').trim()
      }
    }
  }

  if (param.value !== undefined) {
    // For path parameters, prefer string type unless value is explicitly a number type
    // This prevents converting string IDs like "testId" to integers
    if (paramIn === 'path') {
      // Path parameters are typically strings (IDs, slugs, etc.)
      // Only use number/integer if the value is actually a number type, not a string
      if (typeof param.value === 'number') {
        parameter.schema = inferSchemaType(param.value)
      } else {
        // For strings (including empty strings), default to string type
        parameter.schema = { type: 'string' }
      }
    } else {
      parameter.schema = inferSchemaType(param.value)
    }
  } else {
    parameter.schema = { type: 'string' } // Default to string if no value is provided
  }

  // Add x-scalar-disabled extension if parameter is disabled
  if (param.disabled === true) {
    // @ts-expect-error - x-scalar-disabled is not a valid parameter object property
    parameter['x-scalar-disabled'] = true
  }

  return parameter
}
