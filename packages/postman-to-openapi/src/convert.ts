import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { processAuth } from '@/helpers/auth'
import { processContact } from '@/helpers/contact'
import { processExternalDocs } from '@/helpers/external-docs'
import { processLicense } from '@/helpers/license'
import { processLogo } from '@/helpers/logo'
import { processItem } from '@/helpers/path-items'
import { pruneDocument } from '@/helpers/prune-document'
import { analyzeServerDistribution } from '@/helpers/servers'
import { normalizePath } from '@/helpers/urls'

import type { Description, Item, ItemGroup, PostmanCollection } from './types'

const OPERATION_KEYS: readonly (keyof OpenAPIV3_1.PathItemObject)[] = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
]

const normalizeDescription = (description?: Description): string | undefined => {
  if (typeof description === 'string') {
    return description
  }

  return description?.content
}

const parseCollectionInput = (postmanCollection: PostmanCollection | string): unknown => {
  if (typeof postmanCollection !== 'string') {
    return postmanCollection
  }

  try {
    return JSON.parse(postmanCollection) as PostmanCollection
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown parse error'
    const parseError = new Error(`Invalid Postman collection JSON: ${details}`)
    parseError.name = 'PostmanCollectionParseError'
    throw parseError
  }
}

const validateCollectionShape = (collection: unknown): PostmanCollection => {
  if (!collection || typeof collection !== 'object') {
    throw new Error('Invalid Postman collection: expected an object')
  }

  const candidate = collection as Partial<PostmanCollection>

  if (!candidate.info) {
    throw new Error('Missing required info on Postman collection')
  }

  if (!candidate.item || !Array.isArray(candidate.item)) {
    throw new Error('Invalid Postman collection: item must be an array')
  }

  if (typeof candidate.info !== 'object') {
    throw new Error('Invalid Postman collection: info must be an object')
  }

  if (!candidate.info.name) {
    throw new Error('Missing required info.name on Postman collection')
  }

  if (!candidate.info.schema) {
    throw new Error('Invalid Postman collection: missing info.schema')
  }

  if (candidate.variable && !Array.isArray(candidate.variable)) {
    throw new Error('Invalid Postman collection: variable must be an array when provided')
  }

  return candidate as PostmanCollection
}

/**
 * Extracts tags from Postman collection folders.
 * We keep folder nesting using " > " so tag names stay readable while preserving hierarchy.
 * Requests do not produce tags; only folders are reflected as tags.
 */
const isItemGroup = (item: Item | ItemGroup): item is ItemGroup => 'item' in item && Array.isArray(item.item)

const extractTags = (items: PostmanCollection['item']): OpenAPIV3_1.TagObject[] => {
  const collectTags = (item: Item | ItemGroup, parentPath: string = ''): OpenAPIV3_1.TagObject[] => {
    if (!isItemGroup(item)) {
      return []
    }

    const nextPath = item.name ? (parentPath ? `${parentPath} > ${item.name}` : item.name) : parentPath
    const description = normalizeDescription(item.description)
    const currentTag: OpenAPIV3_1.TagObject[] = item.name?.length
      ? [
          {
            name: nextPath,
            ...(description && { description }),
          },
        ]
      : []

    return [...currentTag, ...item.item.flatMap((subItem) => collectTags(subItem, nextPath))]
  }

  return items.flatMap((item) => collectTags(item))
}

const mergeSecuritySchemes = (
  openapi: OpenAPIV3_1.Document,
  securitySchemes?: OpenAPIV3_1.ComponentsObject['securitySchemes'],
): void => {
  if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
    return
  }

  openapi.components = openapi.components || {}
  openapi.components.securitySchemes = {
    ...(openapi.components.securitySchemes ?? {}),
    ...securitySchemes,
  }
}

const mergePathItem = (
  paths: OpenAPIV3_1.PathsObject,
  normalizedPathKey: string,
  pathItem: OpenAPIV3_1.PathItemObject,
): void => {
  const targetPath = (paths[normalizedPathKey] ?? {}) as OpenAPIV3_1.PathItemObject

  for (const [key, value] of Object.entries(pathItem) as [
    keyof OpenAPIV3_1.PathItemObject,
    OpenAPIV3_1.PathItemObject[keyof OpenAPIV3_1.PathItemObject],
  ][]) {
    if (value === undefined) {
      continue
    }

    const isOperationKey = OPERATION_KEYS.includes(key)

    if (isOperationKey && targetPath[key]) {
      const operationName = typeof key === 'string' ? key.toUpperCase() : String(key)
      console.warn(
        `Duplicate operation detected for ${operationName} ${normalizedPathKey}. Last operation will overwrite previous.`,
      )
    }

    targetPath[key] = value
  }

  paths[normalizedPathKey] = targetPath
}

const cleanupOperations = (paths: OpenAPIV3_1.PathsObject): void => {
  Object.values(paths).forEach((pathItem) => {
    if (!pathItem) {
      return
    }

    OPERATION_KEYS.forEach((operationKey) => {
      const operation = pathItem[operationKey]
      if (!operation) {
        return
      }

      if ('parameters' in operation && operation.parameters?.length === 0) {
        delete operation.parameters
      }

      if ('requestBody' in operation && operation.requestBody && 'content' in operation.requestBody) {
        const content = operation.requestBody.content
        if (content && 'text/plain' in content) {
          const text = content['text/plain']
          if (!text?.schema || (text.schema && Object.keys(text.schema).length === 0)) {
            content['text/plain'] = {}
          }
        }
      }

      if (!operation.description) {
        delete operation.description
      }
    })
  })
}

/**
 * Converts a Postman Collection to an OpenAPI 3.1.0 document.
 * This function processes the collection's information, servers, authentication,
 * and items to create a corresponding OpenAPI structure.
 */
export function convert(postmanCollection: PostmanCollection | string): OpenAPIV3_1.Document {
  const collection = validateCollectionShape(parseCollectionInput(postmanCollection))

  // Extract title from collection info, fallback to 'API' if not provided
  const title = collection.info.name || 'API'

  // Look for version in collection variables, default to '1.0.0'
  const version = (collection.variable?.find((v) => v.key === 'version')?.value as string) || '1.0.0'

  // Handle different description formats in Postman
  const description = normalizeDescription(collection.info.description) || ''

  // Process license and contact information
  const license = processLicense(collection)
  const contact = processContact(collection)

  // Process logo information
  const logo = processLogo(collection)

  // Initialize the OpenAPI document with required fields
  const openapi: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title,
      version,
      ...(description && { description }),
      ...(license && { license }),
      ...(contact && { contact }),
      ...(logo && { 'x-logo': logo }),
    },
    paths: {},
  }

  // Process external docs
  const externalDocs = processExternalDocs(collection)
  if (externalDocs) {
    openapi.externalDocs = externalDocs
  }

  // Process authentication if present in the collection
  if (collection.auth) {
    const { securitySchemes, security } = processAuth(collection.auth)
    mergeSecuritySchemes(openapi, securitySchemes)
    openapi.security = security
  }

  // Process each item in the collection and merge into OpenAPI spec
  const allServerUsage: Array<{
    serverUrl: string
    path: string
    method: 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'
  }> = []

  if (collection.item) {
    // Extract tags from folders
    const tags = extractTags(collection.item)
    if (tags.length > 0) {
      openapi.tags = tags
    }

    collection.item.forEach((item) => {
      const { paths: itemPaths, components: itemComponents, serverUsage } = processItem(item)

      // Collect server usage information
      allServerUsage.push(...serverUsage)

      // Merge paths from the current item
      openapi.paths = openapi.paths || {}
      for (const [pathKey, pathItem] of Object.entries(itemPaths)) {
        // Convert colon-style params to curly brace style
        const normalizedPathKey = normalizePath(pathKey)

        if (!pathItem) {
          continue
        }

        mergePathItem(openapi.paths, normalizedPathKey, pathItem)
      }

      // Merge security schemes from the current item
      if (itemComponents?.securitySchemes) {
        mergeSecuritySchemes(openapi, itemComponents.securitySchemes)
      }
    })
  }

  // Extract all unique paths from the document
  const allUniquePaths = new Set<string>()
  if (openapi.paths) {
    for (const pathKey of Object.keys(openapi.paths)) {
      allUniquePaths.add(pathKey)
    }
  }

  // Analyze server distribution and place servers at appropriate levels
  const serverPlacement = analyzeServerDistribution(allServerUsage, allUniquePaths)

  // Add servers to document level
  if (serverPlacement.document.length > 0) {
    openapi.servers = serverPlacement.document
  }

  // Add servers to path items
  if (openapi.paths) {
    for (const [path, servers] of serverPlacement.pathItems.entries()) {
      const normalizedPathKey = normalizePath(path)
      const pathItem = openapi.paths[normalizedPathKey]
      if (pathItem) {
        pathItem.servers = servers
      }
    }

    // Add servers to operations
    for (const [path, methods] of serverPlacement.operations.entries()) {
      const normalizedPathKey = normalizePath(path)
      const pathItem = openapi.paths[normalizedPathKey]
      if (!pathItem) {
        continue
      }
      for (const [method, servers] of methods.entries()) {
        if (method in pathItem) {
          const operation = pathItem[method as keyof typeof pathItem]
          if (operation && typeof operation === 'object' && 'responses' in operation) {
            operation.servers = servers
          }
        }
      }
    }
  }

  // Clean up the generated paths
  if (openapi.paths) {
    cleanupOperations(openapi.paths)
  }

  // Remove empty components object
  if (Object.keys(openapi.components || {}).length === 0) {
    delete openapi.components
  }

  return pruneDocument(openapi)
}
