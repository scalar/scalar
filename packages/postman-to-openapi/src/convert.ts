import type { OpenAPIV3 } from '@scalar/openapi-types'

import { processAuth } from './helpers/authHelpers'
import { processItem } from './helpers/itemHelpers'
import { parseServers } from './helpers/serverHelpers'
import type { PostmanCollection } from './postman'

/**
 * Converts a Postman Collection to an OpenAPI 3.0.0 document.
 * This function processes the collection's information, servers, authentication,
 * and items to create a corresponding OpenAPI structure.
 */
export function convert(
  postmanCollection: PostmanCollection,
): OpenAPIV3.Document {
  const openapi: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
      title: postmanCollection.info.name || 'API',
      version:
        (postmanCollection.variable?.find((v) => v.key === 'version')
          ?.value as string) || '1.0.0',
      description:
        typeof postmanCollection.info.description === 'string'
          ? postmanCollection.info.description
          : postmanCollection.info.description?.content || '',
    },
    servers: parseServers(postmanCollection),
    paths: {},
  }

  if (postmanCollection.auth) {
    processAuth(postmanCollection.auth, openapi)
  }

  if (postmanCollection.item && Array.isArray(postmanCollection.item)) {
    postmanCollection.item.forEach((item) => {
      processItem(item, openapi, [], '')
    })
  }

  // Remove empty components
  if (openapi.components && Object.keys(openapi.components).length === 0) {
    delete openapi.components
  }

  // Remove empty parameters arrays and handle empty request bodies
  if (openapi.paths) {
    Object.values(openapi.paths).forEach((path) => {
      if (path) {
        Object.values(path).forEach((method) => {
          if (method && 'parameters' in method) {
            if (method.parameters && method.parameters.length === 0) {
              delete method.parameters
            }
            if (method.requestBody && 'content' in method.requestBody) {
              const content = method.requestBody.content
              if (
                Object.keys(content).length === 0 ||
                (Object.keys(content).length === 1 &&
                  'text/plain' in content &&
                  (!content['text/plain'].schema ||
                    Object.keys(content['text/plain'].schema).length === 0))
              ) {
                delete method.requestBody
              }
            }
            if (!method.description) {
              method.description = ''
            }
          }
        })
      }
    })
  }

  return openapi
}
