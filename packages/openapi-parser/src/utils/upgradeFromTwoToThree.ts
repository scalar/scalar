import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { AnyObject } from '../types'

/**
 * Upgrade Swagger 2.0 to OpenAPI 3.0
 *
 * https://swagger.io/blog/news/whats-new-in-openapi-3-0/
 */
export function upgradeFromTwoToThree(specification: AnyObject) {
  // Version
  if (specification.swagger?.startsWith('2.0')) {
    specification.openapi = '3.0.3'
    delete specification.swagger
  } else {
    // Skip if it’s something else than 3.0.x
    return specification
  }

  // Servers
  if (specification.host) {
    const schemes = specification.schemes?.length
      ? specification.schemes
      : ['http']

    specification.servers = schemes.map((scheme: string[]) => ({
      url: `${scheme}://${specification.host}${specification.basePath ?? ''}`,
    }))

    delete specification.basePath
    delete specification.schemes
    delete specification.host
  }

  // Schemas
  if (specification.definitions) {
    if (typeof specification.components !== 'object') {
      specification.components = {}
    }

    specification.components.schemas = specification.definitions

    delete specification.definitions
  }

  // Paths
  if (specification.paths) {
    for (const path in specification.paths) {
      if (Object.hasOwn(specification.paths, path)) {
        const pathItem = specification.paths[path]

        for (const method in pathItem) {
          if (Object.hasOwn(pathItem, method)) {
            const operationItem = pathItem[method]

            if (operationItem.responses) {
              for (const response in operationItem.responses) {
                if (Object.hasOwn(operationItem.responses, response)) {
                  const responseItem = operationItem.responses[response]

                  if (responseItem.schema) {
                    const produces = specification.produces ??
                      operationItem.produces ?? ['application/json']

                    for (const type of produces) {
                      if (typeof responseItem.content !== 'object') {
                        responseItem.content = {}
                      }

                      responseItem.content[type] = {
                        schema: responseItem.schema,
                      }
                    }

                    delete responseItem.schema
                  }
                }
              }
            }

            delete operationItem.produces
          }
        }
      }
    }
  }

  return specification as OpenAPIV3.Document
}
