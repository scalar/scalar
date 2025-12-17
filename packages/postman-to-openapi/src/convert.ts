import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { processAuth } from './helpers/auth'
import { processContact } from './helpers/contact'
import { processExternalDocs } from './helpers/external-docs'
import { processLicense } from './helpers/license'
import { processLogo } from './helpers/logo'
import { processItem } from './helpers/path-items'
import { parseServers } from './helpers/servers'
import { normalizePath } from './helpers/urls'
import type { Description, Item, ItemGroup, PostmanCollection } from './types'

const normalizeDescription = (description?: Description): string | undefined => {
  if (typeof description === 'string') {
    return description
  }

  return description?.content
}

const parseCollectionInput = (postmanCollection: PostmanCollection | string): PostmanCollection => {
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

const assertCollectionInfo = (collection: PostmanCollection): void => {
  if (!collection?.info) {
    throw new Error('Missing required info on Postman collection')
  }

  if (!collection.info.name) {
    throw new Error('Missing required info.name on Postman collection')
  }
}

/**
 * Extracts tags from Postman collection folders
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

/**
 * Converts a Postman Collection to an OpenAPI 3.1.0 document.
 * This function processes the collection's information, servers, authentication,
 * and items to create a corresponding OpenAPI structure.
 */
export function convert(postmanCollection: PostmanCollection | string): OpenAPIV3_1.Document {
  const collection = parseCollectionInput(postmanCollection)
  assertCollectionInfo(collection)

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
    servers: parseServers(collection),
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
    openapi.components = openapi.components || {}
    openapi.components.securitySchemes = {
      ...openapi.components.securitySchemes,
      ...securitySchemes,
    }
    openapi.security = security
  }

  // Process each item in the collection and merge into OpenAPI spec
  if (collection.item) {
    // Extract tags from folders
    const tags = extractTags(collection.item)
    if (tags.length > 0) {
      openapi.tags = tags
    }

    collection.item.forEach((item) => {
      const { paths: itemPaths, components: itemComponents } = processItem(item)

      // Merge paths from the current item
      openapi.paths = openapi.paths || {}
      for (const [pathKey, pathItem] of Object.entries(itemPaths)) {
        // Convert colon-style params to curly brace style
        const normalizedPathKey = normalizePath(pathKey)

        if (!pathItem) {
          continue
        }

        if (!openapi.paths[normalizedPathKey]) {
          openapi.paths[normalizedPathKey] = pathItem
        } else {
          openapi.paths[normalizedPathKey] = {
            ...openapi.paths[normalizedPathKey],
            ...pathItem,
          }
        }
      }

      // Merge security schemes from the current item
      if (itemComponents?.securitySchemes) {
        openapi.components = openapi.components || {}
        openapi.components.securitySchemes = {
          ...openapi.components.securitySchemes,
          ...itemComponents.securitySchemes,
        }
      }
    })
  }

  // Clean up the generated paths
  if (openapi.paths) {
    Object.values(openapi.paths).forEach((path) => {
      if (path) {
        Object.values(path).forEach((method) => {
          if (method && 'parameters' in method) {
            // Remove empty parameters array to keep spec clean
            if (method.parameters?.length === 0) {
              delete method.parameters
            }

            // Handle request bodies
            if (method.requestBody?.content) {
              const content = method.requestBody.content
              if (Object.keys(content).length === 0) {
                // Keep an empty requestBody with text/plain content
                method.requestBody = {
                  content: {
                    'text/plain': {},
                  },
                }
              } else if ('text/plain' in content) {
                // Preserve schema if it exists, otherwise keep an empty object
                if (!content['text/plain'].schema || Object.keys(content['text/plain'].schema).length === 0) {
                  content['text/plain'] = {}
                }
              }
            }

            // Ensure all methods have a description, but don't add an empty one if it doesn't exist
            if (!method.description) {
              delete method.description
            }
          }
        })
      }
    })
  }

  // Remove empty components object
  if (Object.keys(openapi.components || {}).length === 0) {
    delete openapi.components
  }

  // Remove undefined properties recursively
  const removeUndefined = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(removeUndefined).filter((item) => item !== undefined)
    }

    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .map(([key, value]) => [key, removeUndefined(value)])
          .filter(([_, value]) => value !== undefined),
      )
    }

    return obj
  }

  return removeUndefined(openapi)
}
