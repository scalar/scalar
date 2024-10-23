import type { OpenAPIV3 } from '@scalar/openapi-types'

import { processAuth } from './helpers/authHelpers'
import { processItem } from './helpers/itemHelpers'
import { parseServers } from './helpers/serverHelpers'
import type { PostmanCollection } from './types'

/**
 * Converts a Postman Collection to an OpenAPI 3.0.0 document.
 * This function processes the collection's information, servers, authentication,
 * and items to create a corresponding OpenAPI structure.
 */
export function convert(
  postmanCollection: PostmanCollection,
): OpenAPIV3.Document {
  // Extract title from collection info, fallback to 'API' if not provided
  const title = postmanCollection.info.name || 'API'

  // Look for version in collection variables, default to '1.0.0'
  const version =
    (postmanCollection.variable?.find((v) => v.key === 'version')
      ?.value as string) || '1.0.0'

  // Handle different description formats in Postman
  const description =
    typeof postmanCollection.info.description === 'string'
      ? postmanCollection.info.description
      : postmanCollection.info.description?.content || ''

  // Initialize the OpenAPI document with required fields
  const openapi: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
      title,
      version,
      description,
    },
    servers: parseServers(postmanCollection),
    paths: {},
    components: {},
  }

  // Process authentication if present in the collection
  if (postmanCollection.auth) {
    const { securitySchemes, security } = processAuth(postmanCollection.auth)
    openapi.components = openapi.components || {}
    openapi.components.securitySchemes = {
      ...openapi.components.securitySchemes,
      ...securitySchemes,
    }
    openapi.security = security
  }

  // Process each item in the collection and merge into OpenAPI spec
  if (postmanCollection.item) {
    postmanCollection.item.forEach((item) => {
      const { paths: itemPaths, components: itemComponents } = processItem(item)

      // Merge paths from the current item
      openapi.paths = openapi.paths || {}
      for (const [pathKey, pathItem] of Object.entries(itemPaths)) {
        if (!openapi.paths[pathKey]) {
          openapi.paths[pathKey] = pathItem
        } else {
          openapi.paths[pathKey] = {
            ...openapi.paths[pathKey],
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

            // Remove empty request bodies or those with only text/plain and no schema
            if (method.requestBody?.content) {
              const content = method.requestBody.content
              if (
                Object.keys(content).length === 0 ||
                (Object.keys(content).length === 1 &&
                  'text/plain' in content &&
                  !content['text/plain'].schema)
              ) {
                delete method.requestBody
              }
            }

            // Ensure all methods have a description
            method.description = method.description || ''
          }
        })
      }
    })
  }

  return openapi
}
