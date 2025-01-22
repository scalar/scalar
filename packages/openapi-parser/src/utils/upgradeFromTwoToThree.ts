import type { OpenAPIV2, OpenAPIV3 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { traverse } from './traverse.ts'

/**
 * Upgrade Swagger 2.0 to OpenAPI 3.0
 *
 * https://swagger.io/blog/news/whats-new-in-openapi-3-0/
 */
export function upgradeFromTwoToThree(originalSpecification: UnknownObject) {
  let specification = originalSpecification

  // Version
  if (
    specification !== null &&
    typeof specification.swagger === 'string' &&
    specification.swagger?.startsWith('2.0')
  ) {
    specification.openapi = '3.0.4'
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
    const schemes =
      Array.isArray(specification.schemes) && specification.schemes?.length
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
    specification.components = Object.assign({}, specification.components, {
      schemas: specification.definitions,
    })

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
  if (typeof specification.paths === 'object') {
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

              // formData parameters
              const formDataParameters = operationItem.parameters.filter(
                (parameter: OpenAPIV2.ParameterObject) =>
                  parameter.in === 'formData',
              )

              if (formDataParameters.length > 0) {
                if (typeof operationItem.requestBody !== 'object') {
                  operationItem.requestBody = {}
                }

                if (typeof operationItem.requestBody.content !== 'object') {
                  operationItem.requestBody.content = {}
                }

                operationItem.requestBody.content[
                  'application/x-www-form-urlencoded'
                ] = {
                  schema: {
                    type: 'object',
                    properties: {},
                    required: [], // Initialize required array
                  },
                }

                for (const param of formDataParameters) {
                  operationItem.requestBody.content[
                    'application/x-www-form-urlencoded'
                  ].schema.properties[param.name] = {
                    type: param.type,
                    description: param.description,
                  }

                  // Add to required array if param is required
                  if (param.required) {
                    operationItem.requestBody.content[
                      'application/x-www-form-urlencoded'
                    ].schema.required.push(param.name)
                  }
                }

                // Remove formData parameters from the parameters array
                operationItem.parameters = operationItem.parameters.filter(
                  (parameter: OpenAPIV2.ParameterObject) =>
                    parameter.in !== 'formData',
                )
              }
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

  // Upgrade securityDefinitions
  if (specification.securityDefinitions) {
    if (typeof specification.components !== 'object') {
      specification.components = {}
    }

    // Assert that components is of type OpenAPIV3.ComponentsObject
    specification.components =
      specification.components as OpenAPIV3.ComponentsObject

    Object.assign(specification.components, { securitySchemes: {} })

    for (const [key, securityScheme] of Object.entries(
      specification.securityDefinitions,
    )) {
      if (typeof securityScheme === 'object') {
        if ('type' in securityScheme && securityScheme.type === 'oauth2') {
          const { flow, authorizationUrl, tokenUrl, scopes } =
            securityScheme as {
              type: 'oauth2'
              flow?: string
              authorizationUrl?: string
              tokenUrl?: string
              scopes?: Record<string, string>
            }

          // Assert that securitySchemes is of type OpenAPIV3.SecuritySchemeObject
          Object.assign(
            (specification.components as OpenAPIV3.ComponentsObject)
              .securitySchemes,
            {
              [key]: {
                type: 'oauth2',
                flows: {
                  [flow as string]: Object.assign(
                    {},
                    authorizationUrl && { authorizationUrl },
                    tokenUrl && { tokenUrl },
                    scopes && { scopes },
                  ),
                },
              },
            },
          )
        } else {
          Object.assign(
            (specification.components as OpenAPIV3.ComponentsObject)
              .securitySchemes,
            { [key]: securityScheme },
          )
        }
      }
    }

    delete specification.securityDefinitions
  }

  return specification as OpenAPIV3.Document
}
