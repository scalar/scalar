import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { Item, ItemGroup } from '../types'
import { processAuth } from './authHelpers'
import { extractParameters } from './parameterHelpers'
import { extractRequestBody } from './requestBodyHelpers'
import { extractResponses } from './responseHelpers'
import { extractPathFromUrl } from './urlHelpers'

type HttpMethods =
  | 'get'
  | 'put'
  | 'post'
  | 'delete'
  | 'options'
  | 'head'
  | 'patch'
  | 'trace'

/**
 * Processes a Postman collection item or item group and returns
 * the corresponding OpenAPI paths and components.
 * Handles nested item groups, extracts request details, and generates corresponding
 * OpenAPI path items and operations.
 */
export function processItem(
  item: Item | ItemGroup,
  parentTags: string[] = [],
  parentPath: string = '',
): { paths: OpenAPIV3.PathsObject; components: OpenAPIV3.ComponentsObject } {
  const paths: OpenAPIV3.PathsObject = {}
  const components: OpenAPIV3.ComponentsObject = {}

  if ('item' in item && Array.isArray(item.item)) {
    const newParentTags = item.name ? [...parentTags, item.name] : parentTags
    item.item.forEach((childItem) => {
      const childResult = processItem(
        childItem,
        newParentTags,
        `${parentPath}/${item.name || ''}`,
      )
      // Merge child paths and components
      for (const [pathKey, pathItem] of Object.entries(childResult.paths)) {
        if (!paths[pathKey]) {
          paths[pathKey] = pathItem
        } else {
          paths[pathKey] = {
            ...paths[pathKey],
            ...pathItem,
          }
        }
      }

      // Merge components.securitySchemes
      if (childResult.components.securitySchemes) {
        components.securitySchemes = {
          ...components.securitySchemes,
          ...childResult.components.securitySchemes,
        }
      }
    })
    return { paths, components }
  }

  if (!('request' in item)) return { paths, components }

  const { request, name, response } = item
  const method = (
    typeof request === 'string' ? 'get' : request.method || 'get'
  ).toLowerCase() as HttpMethods

  const path = extractPathFromUrl(
    typeof request === 'string'
      ? request
      : typeof request.url === 'string'
        ? request.url
        : (request.url?.raw ?? ''),
  )

  const operationObject: OpenAPIV3.OperationObject = {
    tags: parentTags.length > 0 ? [parentTags.join(' > ')] : ['default'],
    summary: name || '',
    description:
      typeof request === 'string'
        ? ''
        : typeof request.description === 'string'
          ? request.description
          : (request.description?.content ?? ''),
    responses: extractResponses(response || []),
    parameters: [],
  }

  try {
    operationObject.parameters = extractParameters(request)
  } catch (error) {
    // Silently handle parameter extraction errors
    operationObject.parameters = []
  }

  if (typeof request !== 'string' && request.auth) {
    if (!operationObject.security) {
      operationObject.security = []
    }
    const { securitySchemes, security } = processAuth(request.auth)

    if (!components.securitySchemes) {
      components.securitySchemes = {}
    }
    components.securitySchemes = {
      ...components.securitySchemes,
      ...securitySchemes,
    }

    operationObject.security.push(...security)
  }

  if (
    ['post', 'put', 'patch'].includes(method) &&
    typeof request !== 'string' &&
    request.body
  ) {
    operationObject.requestBody = extractRequestBody(request.body)
  }

  if (!paths[path]) paths[path] = {}
  const pathItem = paths[path] as OpenAPIV3.PathItemObject
  pathItem[method] = operationObject

  if (item.response && item.response.length > 0) {
    const firstResponse = item.response[0]
    const statusCode = firstResponse.code || 200
    if (pathItem[method]) {
      pathItem[method].responses = {
        [statusCode]: {
          description: firstResponse.status || 'Successful response',
          content: {
            'application/json': {},
          },
        },
      }
    }
  } else {
    if (pathItem[method]) {
      pathItem[method].responses = {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {},
          },
        },
      }
    }
  }

  return { paths, components }
}
