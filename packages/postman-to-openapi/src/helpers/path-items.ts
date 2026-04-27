import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Item, ItemGroup } from '@/types'

import { processAuth } from './auth'
import { parseMediaType, pickAcceptMediaType, readHeader } from './header-utils'
import { parseMdTable } from './markdown'
import { extractParameters } from './parameters'
import { processPostResponseScripts } from './post-response-scripts'
import { processPreRequestScripts } from './pre-request-scripts'
import { extractRequestBody } from './request-body'
import { DEFAULT_RESPONSE_DESCRIPTIONS, extractResponses } from './responses'
import { extractPathFromUrl, extractPathParameterNames, extractServerObjectFromUrl, normalizePath } from './urls'

type HttpMethods = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'

export const POSTMAN_EXAMPLE_NAME_EXTENSION = 'x-postman-example-name'
export const POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION = 'x-postman-pre-request-scripts'
export const POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION = 'x-postman-post-response-scripts'
// Raw Postman folder-name chain for the operation. Used internally to preserve
// template hints (for example `/applications/{id}`) even when tag names are
// simplified. Stripped before emitting the final OpenAPI document.
export const POSTMAN_FOLDER_SEGMENTS_EXTENSION = 'x-postman-folder-segments'

/**
 * Information about server usage for an operation.
 */
export type ServerUsage = {
  serverUrl: string
  server?: OpenAPIV3_1.ServerObject
  path: string
  method: HttpMethods
}

type CollectionVariableLookup = ReadonlyMap<string, string>

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
  exampleName: string = 'default',
  parentTags: string[] = [],
  parentPath: string = '',
  preserveCollapsedVariants: boolean = false,
  resolveTagName?: (segments: string[]) => string | undefined,
  collectionVariableLookup: CollectionVariableLookup = new Map(),
  keepHeaders?: readonly string[],
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
      const childResult = processItem(
        childItem,
        exampleName,
        newParentTags,
        `${parentPath}/${item.name || ''}`,
        preserveCollapsedVariants,
        resolveTagName,
        collectionVariableLookup,
        keepHeaders,
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

      // Merge server usage
      serverUsage.push(...childResult.serverUsage)
    })
    return { paths, components, serverUsage }
  }

  if (!('request' in item)) {
    return { paths, components, serverUsage }
  }

  const { request, name, response } = item
  const sourceRequestName = name?.trim() || exampleName
  const operationExampleName = preserveCollapsedVariants ? sourceRequestName : exampleName
  const method = (typeof request === 'string' ? 'get' : request.method || 'get').toLowerCase() as HttpMethods

  const requestUrl =
    typeof request === 'string' ? request : typeof request.url === 'string' ? request.url : (request.url?.raw ?? '')

  const path = extractPathFromUrl(requestUrl)

  // Normalize path parameters from ':param' to '{param}'
  const normalizedPath = normalizePath(path)

  // Extract server URL from request URL
  const server = extractServerObjectFromUrl(requestUrl, collectionVariableLookup)
  if (server?.url) {
    serverUsage.push({
      serverUrl: server.url,
      server,
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
  const tagName =
    parentTags.length > 0 ? (resolveTagName ? resolveTagName(parentTags) : parentTags.join(' > ')) : undefined

  // Derive media-type signals from request headers before they are filtered out
  // of `parameters[in=header]`. Content-Type drives the request body media type;
  // Accept drives responses when no saved-response Content-Type is available.
  const requestHeaders = typeof request === 'string' ? undefined : request.header
  const contentType = parseMediaType(readHeader(requestHeaders, 'Content-Type'))
  const acceptMediaType = pickAcceptMediaType(readHeader(requestHeaders, 'Accept'))

  const operationObject: OpenAPIV3_1.OperationObject = {
    tags: tagName ? [tagName] : undefined,
    summary,
    description,
    responses: extractResponses(response || [], item, acceptMediaType),
    parameters: [],
  }
  if (parentTags.length > 0) {
    operationObject[POSTMAN_FOLDER_SEGMENTS_EXTENSION] = [...parentTags]
  }
  if (preserveCollapsedVariants) {
    operationObject[POSTMAN_EXAMPLE_NAME_EXTENSION] = sourceRequestName
  }

  // Add pre-request scripts if present
  const preRequestScript = processPreRequestScripts(item.event)
  if (preRequestScript) {
    operationObject['x-pre-request'] = preRequestScript
    if (preserveCollapsedVariants) {
      operationObject[POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION] = {
        [sourceRequestName]: preRequestScript,
      }
    }
  }

  // Add post-response scripts if present
  const postResponseScript = processPostResponseScripts(item.event)
  if (postResponseScript) {
    operationObject['x-post-response'] = postResponseScript
    if (preserveCollapsedVariants) {
      operationObject[POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION] = {
        [sourceRequestName]: postResponseScript,
      }
    }
  }

  // Only add operationId if it was explicitly provided
  if (operationId) {
    operationObject.operationId = operationId
  }

  // Extract parameters from the request (query, path, header)
  // This should always happen, regardless of whether a description exists
  const extractedParameters = extractParameters(request, operationExampleName, keepHeaders)

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
    const requestBody = extractRequestBody(request.body, operationExampleName, contentType)
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

  if (preserveCollapsedVariants) {
    addResponseFromRequestName(pathItem[method], name)
  }

  return { paths, components, serverUsage }
}

export function parseStatusCodeFromRequestName(
  requestName: string | undefined,
): { statusCode: string; description: string } | null {
  if (!requestName) {
    return null
  }

  const trimmedStart = requestName.trimStart()
  if (trimmedStart.length < 4) {
    return null
  }

  const statusCode = trimmedStart.slice(0, 3)
  if (!isThreeDigitStatusCode(statusCode)) {
    return null
  }

  let separatorIndex = 3
  while (trimmedStart[separatorIndex] === ' ') {
    separatorIndex += 1
  }

  const separator = trimmedStart[separatorIndex]
  if (separator !== '-' && separator !== ':') {
    return null
  }

  let descriptionIndex = separatorIndex + 1
  while (trimmedStart[descriptionIndex] === ' ') {
    descriptionIndex += 1
  }

  return {
    statusCode,
    description: trimmedStart.slice(descriptionIndex).trim() || 'Response',
  }
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

/** OpenAPI 3.1 parameter schema types (ParameterObject uses OpenAPIV3_1). */
const OPENAPI_PARAM_SCHEMA_TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array'] as const

type OpenApiParamSchemaType = (typeof OPENAPI_PARAM_SCHEMA_TYPES)[number]

function toOpenApiParamSchemaType(s: string | undefined): OpenApiParamSchemaType {
  const value = s ?? 'string'
  for (const t of OPENAPI_PARAM_SCHEMA_TYPES) {
    if (t === value) {
      return t
    }
  }
  return 'string'
}

function parameterSchemaFromType(type: OpenApiParamSchemaType): OpenAPIV3_1.ParameterObject['schema'] {
  if (type === 'array') {
    return { type: 'array' }
  }
  return { type }
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
        schema: parameterSchemaFromType(toOpenApiParamSchemaType(row.type)),
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

function addResponseFromRequestName(
  operationObject: OpenAPIV3_1.OperationObject,
  requestName: string | undefined,
): void {
  const parsedStatus = parseStatusCodeFromRequestName(requestName)
  if (!parsedStatus) {
    return
  }

  operationObject.responses = operationObject.responses ?? {}
  const existingResponse = operationObject.responses[parsedStatus.statusCode]
  if (!existingResponse) {
    operationObject.responses[parsedStatus.statusCode] = { description: parsedStatus.description }
    return
  }

  const defaultDescriptions = new Set([
    'Successful response',
    'Response',
    ...Object.values(DEFAULT_RESPONSE_DESCRIPTIONS),
  ])

  if (
    typeof existingResponse === 'object' &&
    !('$ref' in existingResponse) &&
    defaultDescriptions.has(existingResponse.description ?? '')
  ) {
    existingResponse.description = parsedStatus.description
  }
}

function isThreeDigitStatusCode(value: string): boolean {
  if (value.length !== 3) {
    return false
  }

  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index)
    if (charCode < 48 || charCode > 57) {
      return false
    }
  }

  return true
}
