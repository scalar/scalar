import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Item, ItemGroup } from '../types'
import { processAuth } from './authHelpers'
import { parseMdTable } from './md-utils'
import { extractParameters } from './parameterHelpers'
import { processPostResponseScripts } from './postResponseScripts'
import { extractRequestBody } from './requestBodyHelpers'
import { extractResponses } from './responseHelpers'
import { extractPathFromUrl, extractPathParameterNames, normalizePath } from './urlHelpers'

type HttpMethods = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'

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
): {
  paths: OpenAPIV3_1.PathsObject
  components: OpenAPIV3_1.ComponentsObject
} {
  const paths: OpenAPIV3_1.PathsObject = {}
  const components: OpenAPIV3_1.ComponentsObject = {}

  if ('item' in item && Array.isArray(item.item)) {
    const newParentTags = item.name ? [...parentTags, item.name] : parentTags
    item.item.forEach((childItem) => {
      const childResult = processItem(childItem, newParentTags, `${parentPath}/${item.name || ''}`)
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

  if (!('request' in item)) {
    return { paths, components }
  }

  const { request, name, response } = item
  const method = (typeof request === 'string' ? 'get' : request.method || 'get').toLowerCase() as HttpMethods

  const path = extractPathFromUrl(
    typeof request === 'string' ? request : typeof request.url === 'string' ? request.url : (request.url?.raw ?? ''),
  )

  // Normalize path parameters from ':param' to '{param}'
  const normalizedPath = normalizePath(path)

  // Extract path parameter names
  const pathParameterNames = extractPathParameterNames(normalizedPath)

  // Extract operation ID if present
  const { operationId, summary } = extractOperationInfo(name)

  const description =
    typeof request === 'string'
      ? ''
      : typeof request.description === 'string'
        ? request.description
        : (request.description?.content ?? '')

  const operationObject: OpenAPIV3_1.OperationObject = {
    tags: parentTags.length > 0 ? [parentTags.join(' > ')] : undefined,
    summary,
    description,
    responses: extractResponses(response || [], item),
    parameters: [],
  }

  // Add post-response scripts if present
  const postResponseScript = processPostResponseScripts(item.event)
  if (postResponseScript) {
    operationObject['x-post-response'] = postResponseScript
  }

  // Only add operationId if it was explicitly provided
  if (operationId) {
    operationObject.operationId = operationId
  }

  // Parse parameters from the description's Markdown table
  if (operationObject.description) {
    const { descriptionWithoutTable, parametersFromTable } = parseParametersFromDescription(operationObject.description)
    operationObject.description = descriptionWithoutTable.trim()

    // Extract parameters from the request (query, path, header)
    const extractedParameters = extractParameters(request)

    // Merge parameters, giving priority to those from the Markdown table
    const mergedParameters = new Map<string, OpenAPIV3_1.ParameterObject>()

    // Add extracted parameters, filtering out path parameters not in the path
    extractedParameters.forEach((param) => {
      if (param.name) {
        if (param.in === 'path' && !pathParameterNames.includes(param.name)) {
          return
        }
        mergedParameters.set(param.name, param)
      }
    })

    // Add parameters from table, filtering out path parameters not in the path
    parametersFromTable.forEach((param) => {
      if (param.name) {
        if (param.in === 'path' && !pathParameterNames.includes(param.name)) {
          return
        }
        mergedParameters.set(param.name, param)
      }
    })

    operationObject.parameters = Array.from(mergedParameters.values())
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

  if (['post', 'put', 'patch'].includes(method) && typeof request !== 'string' && request.body) {
    operationObject.requestBody = extractRequestBody(request.body)
  }

  if (!paths[path]) {
    paths[path] = {}
  }
  const pathItem = paths[path] as OpenAPIV3_1.PathItemObject
  pathItem[method] = operationObject

  return { paths, components }
}

// Helper function to parse parameters from the description if it is markdown
function parseParametersFromDescription(description: string): {
  descriptionWithoutTable: string
  parametersFromTable: OpenAPIV3_1.ParameterObject[]
} {
  const lines = description.split('\n')
  let inTable = false
  const tableLines: string[] = []
  const descriptionLines: string[] = []

  for (const line of lines) {
    // Detect the start of the table
    if (line.trim().startsWith('|')) {
      // Remove any preceding headers or empty lines before the table
      while (
        descriptionLines.length > 0 &&
        (descriptionLines[descriptionLines.length - 1]?.trim() === '' ||
          descriptionLines[descriptionLines.length - 1]?.trim().startsWith('#'))
      ) {
        descriptionLines.pop()
      }

      // Start collecting table lines
      inTable = true
    }

    if (inTable) {
      tableLines.push(line)
      // Detect the end of the table (any line that doesn't start with '|', excluding the alignment line)
      if (!line.trim().startsWith('|') && !line.trim().match(/^-+$/)) {
        inTable = false
      }
    } else {
      descriptionLines.push(line)
    }
  }

  const tableMarkdown = tableLines.join('\n')
  const parsedTable = parseMdTable(tableMarkdown)
  const parametersFromTable = Object.values(parsedTable).map((paramData: any) => {
    const paramIn = paramData.object as 'query' | 'header' | 'path'

    const param: OpenAPIV3_1.ParameterObject = {
      name: paramData.name,
      in: paramIn,
      description: paramData.description,
      required: paramData.required === 'true',
      schema: {
        type: paramData.type,
      },
    }

    if (paramData.example) {
      param.example = paramData.example
    }

    return param
  })

  const descriptionWithoutTable = descriptionLines.join('\n')
  return { descriptionWithoutTable, parametersFromTable }
}

// Instead of using regex with \s*, let's split this into two steps
function extractOperationInfo(name: string | undefined) {
  if (!name) {
    return { operationId: undefined, summary: undefined }
  }

  // First check if the string ends with something in brackets
  const match = name.match(/\[([^[\]]{0,1000})\]$/)
  if (!match) {
    return { operationId: undefined, summary: name }
  }

  // Get the operation ID from inside brackets
  const operationId = match[1]

  // Trim the brackets part from the end using string operations instead of regex
  const lastBracketIndex = name.lastIndexOf('[')
  const summary = name.substring(0, lastBracketIndex).trim()

  return { operationId, summary }
}
