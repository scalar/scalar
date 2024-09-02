import type { OpenAPIV2, OpenAPIV3 } from '@scalar/openapi-types'

import type { AnyObject } from '../types'
import { traverse } from './traverse'

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

  console.warn(
    `[upgradeFromTwoToThree] The upgrade from Swagger 2.0 to OpenAPI 3.0 documents is experimental and lacks features.`,
  )

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

    // Rewrite $refs to definitions
    specification = traverse(specification, (schema) => {
      if (schema.$ref?.startsWith('#/definitions/')) {
        schema.$ref = schema.$ref.replace(
          /^#\/definitions\//,
          '#/components/schemas/',
        )
      }

      return schema
    })
  }

  // Paths
  if (specification.paths) {
    for (const path in specification.paths) {
      if (Object.hasOwn(specification.paths, path)) {
        const pathItem = specification.paths[path]

        for (const method in pathItem) {
          if (Object.hasOwn(pathItem, method)) {
            const operationItem = pathItem[method]

            // Request bodies
            if (operationItem.parameters) {
              const bodyParameter = structuredClone(
                operationItem.parameters.find(
                  (parameter: OpenAPIV3.ParameterObject) =>
                    parameter.in === 'body',
                ) ?? {},
              )

              if (bodyParameter && Object.keys(bodyParameter).length) {
                delete bodyParameter.name
                delete bodyParameter.in

                const consumes = specification.consumes ??
                  operationItem.consumes ?? ['application/json']

                if (typeof operationItem.requestBody !== 'object') {
                  operationItem.requestBody = {}
                }

                if (typeof operationItem.requestBody.content !== 'object') {
                  operationItem.requestBody.content = {}
                }

                const { schema, ...requestBody } = bodyParameter

                operationItem.requestBody = {
                  ...operationItem.requestBody,
                  ...requestBody,
                }

                for (const type of consumes) {
                  operationItem.requestBody.content[type] = {
                    schema: schema,
                  }
                }
              }

              // Delete body parameter
              operationItem.parameters = operationItem.parameters.filter(
                (parameter: OpenAPIV2.ParameterObject) =>
                  parameter.in !== 'body',
              )

              delete operationItem.consumes
            }

            // Responses
            if (operationItem.responses) {
              for (const response in operationItem.responses) {
                if (Object.hasOwn(operationItem.responses, response)) {
                  const responseItem = operationItem.responses[response]

                  if (responseItem.schema) {
                    const produces = specification.produces ??
                      operationItem.produces ?? ['application/json']

                    if (typeof responseItem.content !== 'object') {
                      responseItem.content = {}
                    }

                    for (const type of produces) {
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

            // Delete empty parameters
            if (operationItem.parameters?.length === 0) {
              delete operationItem.parameters
            }
          }
        }
      }
    }
  }

  return specification as OpenAPIV3.Document
}
