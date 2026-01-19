import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Item, ItemGroup } from '@/types'

import { processAuth } from './auth'
import { parseMdTable } from './markdown'
import { extractParameters } from './parameters'
import { processPostResponseScripts } from './post-response-scripts'
import { processPreRequestScripts } from './pre-request-scripts'
import { extractRequestBody } from './request-body'
import { extractResponses } from './responses'
import { extractPathFromUrl, extractPathParameterNames, extractServerFromUrl, normalizePath } from './urls'

type HttpMethods = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'

/**
 * Information about server usage for an operation.
 */
export type ServerUsage = {
  serverUrl: string
  path: string
  method: HttpMethods
}

function ensureRequestBodyContent(requestBody: OpenAPIV3_1.RequestBodyObject): void {
  const content = requestBody.content ?? {}

  if (Object.keys(content).length === 0) {
    requestBody.content = {
      'text/plain': {},
    }
    return
  }

  if ('text/plain' in content) {
    const textContent = content['text/plain']
    if (!textContent?.schema || (textContent.schema && Object.keys(textContent.schema).length === 0)) {
      content['text/plain'] = {}
    }
  }
}

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
  serverUsage: ServerUsage[]
} {
  const paths: OpenAPIV3_1.PathsObject = {}
  const components: OpenAPIV3_1.ComponentsObject = {}
  const serverUsage: ServerUsage[] = []

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

      // Merge server usage
      serverUsage.push(...childResult.serverUsage)
    })
    return { paths, components, serverUsage }
  }

  if (!('request' in item)) {
    return { paths, components, serverUsage }
  }

  const { request, name, response } = item
  const method = (typeof request === 'string' ? 'get' : request.method || 'get').toLowerCase() as HttpMethods

  const requestUrl =
    typeof request === 'string' ? request : typeof request.url === 'string' ? request.url : (request.url?.raw ?? '')

  const path = extractPathFromUrl(requestUrl)

  // Normalize path parameters from ':param' to '{param}'
  const normalizedPath = normalizePath(path)

  // Extract server URL from request URL
  const serverUrl = extractServerFromUrl(requestUrl)
  if (serverUrl) {
    serverUsage.push({
      serverUrl,
      path: normalizedPath,
      method,
    })
  }

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

  // Add pre-request scripts if present
  const preRequestScript = processPreRequestScripts(item.event)
  if (preRequestScript) {
    operationObject['x-pre-request'] = preRequestScript
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

  // Extract parameters from the request (query, path, header)
  // This should always happen, regardless of whether a description exists
  const extractedParameters = extractParameters(request)

  // Merge parameters, giving priority to those from the Markdown table if description exists
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

  // Parse parameters from the description's Markdown table if description exists
  if (operationObject.description) {
    const { descriptionWithoutTable, parametersFromTable } = parseParametersFromDescription(operationObject.description)
    operationObject.description = descriptionWithoutTable.trim()

    // Add parameters from table, filtering out path parameters not in the path
    // These take priority over extracted parameters
    parametersFromTable.forEach((param) => {
      if (param.name) {
        if (param.in === 'path' && !pathParameterNames.includes(param.name)) {
          return
        }
        mergedParameters.set(param.name, param)
      }
    })
  }

  // Set parameters if we have any
  if (mergedParameters.size > 0) {
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

  // Allow request bodies for all methods (including GET) if body is present
  if (typeof request !== 'string' && request.body) {
    const requestBody = extractRequestBody(request.body)
    ensureRequestBodyContent(requestBody)
    // Only add requestBody if it has content
    if (requestBody.content && Object.keys(requestBody.content).length > 0) {
      operationObject.requestBody = requestBody
    }
  }

  if (!paths[path]) {
    paths[path] = {}
  }
  const pathItem = paths[path] as OpenAPIV3_1.PathItemObject
  pathItem[method] = operationObject

  return { paths, components, serverUsage }
}

// Helper function to parse parameters from the description if it is markdown
type ParameterRow = {
  object?: 'query' | 'header' | 'path' | string
  name?: string
  description?: string
  required?: string
  type?: string
  example?: string
}

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
  const parametersFromTable = Object.values(parsedTable)
    .map((paramData) => {
      const row = paramData as ParameterRow
      if (row.object !== 'query' && row.object !== 'header' && row.object !== 'path') {
        return undefined
      }

      if (!row.name) {
        return undefined
      }

      const param: OpenAPIV3_1.ParameterObject = {
        name: row.name,
        in: row.object,
        description: row.description,
        required: row.required === 'true',
        schema: { type: row.type || 'string' },
      }

      if (row.example) {
        param.example = row.example
      }

      return param
    })
    .filter((param): param is OpenAPIV3_1.ParameterObject => Boolean(param))

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
