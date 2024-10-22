import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { Item, ItemGroup } from '../postman'
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
 * Processes a Postman collection item or item group and updates the OpenAPI document.
 * Handles nested item groups, extracts request details, and generates corresponding
 * OpenAPI path items and operations.
 */
export function processItem(
  item: Item | ItemGroup,
  openapi: OpenAPIV3.Document,
  parentTags: string[] = [],
  parentPath: string = '',
): void {
  if ('item' in item && Array.isArray(item.item)) {
    const newParentTags = item.name ? [...parentTags, item.name] : parentTags
    item.item.forEach((childItem) =>
      processItem(
        childItem,
        openapi,
        newParentTags,
        `${parentPath}/${item.name || ''}`,
      ),
    )
    return
  }

  if (!('request' in item)) return

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

  if (!openapi.paths) openapi.paths = {}
  if (!openapi.paths[path]) openapi.paths[path] = {}

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
    console.warn(`Failed to extract parameters for ${item.name}: ${error}`)
    operationObject.parameters = []
  }

  if (typeof request !== 'string' && request.auth) {
    if (!operationObject.security) {
      operationObject.security = []
    }
    processAuth(request.auth, openapi, operationObject.security)
  }

  if (
    ['post', 'put', 'patch'].includes(method) &&
    typeof request !== 'string' &&
    request.body
  ) {
    operationObject.requestBody = extractRequestBody(request.body)
  }

  const pathItem = openapi.paths[path] as OpenAPIV3.PathItemObject
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
}
