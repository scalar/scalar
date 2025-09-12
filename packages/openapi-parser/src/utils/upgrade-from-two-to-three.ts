import type { OpenAPIV2, OpenAPIV3 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { traverse } from './traverse'

/** Update the flow names to OpenAPI 3.1.0 format */
const upgradeFlow = (flow: string): 'implicit' | 'password' | 'clientCredentials' | 'authorizationCode' => {
  switch (flow) {
    case 'application':
      return 'clientCredentials'
    case 'accessCode':
      return 'authorizationCode'
    case 'implicit':
      return 'implicit'
    case 'password':
      return 'password'
    default:
      return flow as never
  }
}

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
    typeof specification === 'object' &&
    typeof specification.swagger === 'string' &&
    specification.swagger?.startsWith('2.0')
  ) {
    specification.openapi = '3.0.4'
    delete specification.swagger
  } else {
    // Skip if it's something else than 3.0.x
    return specification
  }

  // Servers
  if (specification.host) {
    const schemes =
      Array.isArray(specification.schemes) && specification.schemes?.length ? specification.schemes : ['http']

    specification.servers = schemes.map((scheme: string[]) => ({
      url: `${scheme}://${specification.host}${specification.basePath ?? ''}`,
    }))

    delete specification.basePath
    delete specification.schemes
    delete specification.host
  } else if (specification.basePath) {
    specification.servers = [{ url: specification.basePath }]
    delete specification.basePath
  }

  // Schemas
  if (specification.definitions) {
    specification.components = Object.assign({}, specification.components, {
      schemas: specification.definitions,
    })

    delete specification.definitions

    // Rewrite $refs to definitions
    specification = traverse(specification, (schema) => {
      // Rewrite $refs to components
      if (typeof schema.$ref === 'string' && schema.$ref.startsWith('#/definitions/')) {
        schema.$ref = schema.$ref.replace(/^#\/definitions\//, '#/components/schemas/')
      }

      return schema
    })
  }

  // Transform file type to string with binary format
  specification = traverse(specification, (schema) => {
    if (schema.type === 'file') {
      schema.type = 'string'
      schema.format = 'binary'
    }

    return schema
  })

  if (Object.hasOwn(specification, 'parameters')) {
    // update all the $refs before we do any transformations
    specification = traverse(specification, (schema) => {
      if (typeof schema.$ref === 'string' && schema.$ref.startsWith('#/parameters/')) {
        const schemaName = schema.$ref.split('/')[2]

        const param = specification.parameters?.[schemaName]

        if (param?.in === 'body' || param?.in === 'formData') {
          schema.$ref = schema.$ref.replace(/^#\/parameters\//, '#/components/requestBodies/')
        } else {
          schema.$ref = schema.$ref.replace(/^#\/parameters\//, '#/components/parameters/')
        }
      }

      return schema
    })

    specification.components ??= {}

    const params = {}
    const bodyParams = {}
    for (const [name, param] of Object.entries(specification.parameters ?? {})) {
      if (param.in === 'body') {
        bodyParams[name] = migrateBodyParameter(
          param,
          (specification.consumes as string[] | undefined) ?? ['application/json'],
        )
      } else if (param.in === 'formData') {
        bodyParams[name] = migrateFormDataParameter(param)
      } else {
        params[name] = transformParameterObject(param)
      }
    }

    if (Object.keys(params).length > 0) {
      ;(specification.components as UnknownObject).parameters = params
    }

    if (Object.keys(bodyParams).length > 0) {
      ;(specification.components as UnknownObject).requestBodies = bodyParams
    }

    delete specification.parameters
  }

  // Paths
  if (typeof specification.paths === 'object') {
    for (const path in specification.paths) {
      if (Object.hasOwn(specification.paths, path)) {
        const pathItem = specification.paths[path]

        let requestBodyObject: OpenAPIV3.RequestBodyObject | undefined

        for (const methodOrParameters in pathItem) {
          if (methodOrParameters === 'parameters' && Object.hasOwn(pathItem, methodOrParameters)) {
            const pathItemParameters = migrateParameters(
              pathItem.parameters,
              (specification.consumes as string[] | undefined) ?? ['application/json'],
            )

            pathItem.parameters = pathItemParameters.parameters
            requestBodyObject = pathItemParameters.requestBody
          } else if (Object.hasOwn(pathItem, methodOrParameters)) {
            const operationItem = pathItem[methodOrParameters]

            if (requestBodyObject) {
              operationItem.requestBody = requestBodyObject
            }

            if (operationItem.parameters) {
              const migrationResult = migrateParameters(
                operationItem.parameters,
                operationItem.consumes ?? specification.consumes ?? ['application/json'],
              )

              operationItem.parameters = migrationResult.parameters

              if (migrationResult.requestBody) {
                operationItem.requestBody = migrationResult.requestBody
              }

              delete operationItem.consumes
            }

            // Responses
            if (operationItem.responses) {
              for (const response in operationItem.responses) {
                if (Object.hasOwn(operationItem.responses, response)) {
                  const responseItem = operationItem.responses[response]

                  if (responseItem.headers) {
                    responseItem.headers = Object.entries(responseItem.headers).reduce((acc, [name, header]) => {
                      return {
                        [name]: transformParameterObject(header),
                        ...acc,
                      }
                    }, {})
                  }
                  if (responseItem.schema) {
                    const produces = specification.produces ?? operationItem.produces ?? ['application/json']

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
    specification.components = specification.components as OpenAPIV3.ComponentsObject

    Object.assign(specification.components, { securitySchemes: {} })

    for (const [key, securityScheme] of Object.entries(specification.securityDefinitions)) {
      if (typeof securityScheme === 'object') {
        if ('type' in securityScheme && securityScheme.type === 'oauth2') {
          const { flow, authorizationUrl, tokenUrl, scopes } = securityScheme as {
            type: 'oauth2'
            flow?: string
            authorizationUrl?: string
            tokenUrl?: string
            scopes?: Record<string, string>
          }

          // Convert flow values to OpenAPI 3.1.0 format

          // Assert that securitySchemes is of type OpenAPIV3.SecuritySchemeObject
          Object.assign((specification.components as OpenAPIV3.ComponentsObject).securitySchemes, {
            [key]: {
              type: 'oauth2',
              flows: {
                [upgradeFlow(flow)]: Object.assign(
                  {},
                  authorizationUrl && { authorizationUrl },
                  tokenUrl && { tokenUrl },
                  scopes && { scopes },
                ),
              },
            },
          })
        } else if ('type' in securityScheme && securityScheme.type === 'basic') {
          Object.assign((specification.components as OpenAPIV3.ComponentsObject).securitySchemes, {
            [key]: {
              type: 'http',
              scheme: 'basic',
            },
          })
        } else {
          Object.assign((specification.components as OpenAPIV3.ComponentsObject).securitySchemes, {
            [key]: securityScheme,
          })
        }
      }
    }

    delete specification.securityDefinitions
  }

  delete specification.consumes
  delete specification.produces

  return specification as OpenAPIV3.Document
}

function transformItemsObject<T extends Record<PropertyKey, unknown>>(obj: T): OpenAPIV3.SchemaObject {
  const schemaProperties = [
    'type',
    'format',
    'items',
    'maximum',
    'exclusiveMaximum',
    'minimum',
    'exclusiveMinimum',
    'maxLength',
    'minLength',
    'pattern',
    'maxItems',
    'minItems',
    'uniqueItems',
    'enum',
    'multipleOf',
  ]

  return schemaProperties.reduce((acc, property) => {
    if (Object.hasOwn(obj, property)) {
      acc[property] = obj[property]
      delete obj[property]
    }

    return acc
  }, {} as OpenAPIV3.SchemaObject)
}

function transformParameterObject(parameter: OpenAPIV2.ParameterObject): OpenAPIV3.ParameterObject {
  // it is important to call getParameterSerializationStyle first because transformItemsObject modifies properties on which getParameterSerializationStyle rely on
  const serializationStyle = getParameterSerializationStyle(parameter)
  const schema = transformItemsObject(parameter)

  delete parameter.collectionFormat
  delete parameter.default

  return {
    schema,
    ...serializationStyle,
    ...parameter,
  }
}

type CollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi'

type ParameterSerializationStyle = { style?: string; explode?: boolean }

const querySerialization: Record<CollectionFormat, ParameterSerializationStyle> = {
  ssv: {
    style: 'spaceDelimited',
    explode: false,
  },
  pipes: {
    style: 'pipeDelimited',
    explode: false,
  },
  multi: {
    style: 'form',
    explode: true,
  },
  csv: {
    style: 'form',
    explode: false,
  },
  tsv: {},
}

const pathAndHeaderSerialization: Record<CollectionFormat, ParameterSerializationStyle> = {
  ssv: {},
  pipes: {},
  multi: {},
  csv: {
    style: 'simple',
    explode: false,
  },
  tsv: {},
}

const serializationStyles = {
  header: pathAndHeaderSerialization,
  query: querySerialization,
  path: pathAndHeaderSerialization,
} as const

function getParameterSerializationStyle(parameter: OpenAPIV2.ParameterObject): ParameterSerializationStyle {
  if (
    parameter.type !== 'array' ||
    !(parameter.in === 'query' || parameter.in === 'path' || parameter.in === 'header')
  ) {
    return {}
  }

  const collectionFormat = parameter.collectionFormat ?? 'csv'

  return serializationStyles[parameter.in][collectionFormat]
}

type ParameterMigrationResult = {
  parameters: OpenAPIV3.ParameterObject[]
  requestBody?: OpenAPIV3.RequestBodyObject
}

function migrateBodyParameter(
  bodyParameter: OpenAPIV2.ParameterObject,
  consumes: string[],
): OpenAPIV3.RequestBodyObject {
  delete bodyParameter.name
  delete bodyParameter.in

  const { schema, ...requestBody } = bodyParameter

  const requestBodyObject: OpenAPIV3.RequestBodyObject = {
    content: {},
    ...requestBody,
  }

  for (const type of consumes) {
    requestBodyObject.content[type] = {
      schema: schema,
    }
  }

  return requestBodyObject
}

function migrateFormDataParameter(parameters: OpenAPIV2.ParameterObject[]): OpenAPIV3.RequestBodyObject {
  const requestBodyObject: OpenAPIV3.RequestBodyObject = {
    content: {},
  }

  requestBodyObject.content['application/x-www-form-urlencoded'] = {
    schema: {
      type: 'object',
      properties: {},
      required: [], // Initialize required array
    },
  }

  console.log({ parameters })
  for (const param of parameters) {
    requestBodyObject.content['application/x-www-form-urlencoded'].schema.properties[param.name] = {
      type: param.type,
      description: param.description,
    }

    // Add to required array if param is required
    if (param.required) {
      requestBodyObject.content['application/x-www-form-urlencoded'].schema.required.push(param.name)
    }
  }

  return requestBodyObject
}

function migrateParameters(parameters: OpenAPIV2.ParameterObject[], consumes: string[]): ParameterMigrationResult {
  const result: ParameterMigrationResult = {
    parameters: parameters
      .filter((parameter) => !(parameter.in === 'body' || parameter.in === 'formData'))
      .map((parameter) => transformParameterObject(parameter)),
  }

  const bodyParameter = structuredClone(
    parameters.find((parameter: OpenAPIV3.ParameterObject) => parameter.in === 'body') ?? {},
  )

  if (bodyParameter && Object.keys(bodyParameter).length) {
    result.requestBody = migrateBodyParameter(bodyParameter, consumes)
  }

  const formDataParameters = parameters.filter((parameter: OpenAPIV2.ParameterObject) => parameter.in === 'formData')

  if (formDataParameters.length > 0) {
    const requestBodyObject = migrateFormDataParameter(formDataParameters)

    if (typeof result.requestBody !== 'object') {
      result.requestBody = requestBodyObject
    } else {
      result.requestBody = {
        ...result.requestBody,
        content: {
          ...result.requestBody.content,
          ...requestBodyObject.content,
        },
      }
    }

    if (typeof result.requestBody !== 'object') {
      result.requestBody = {
        content: {},
      }
    }
  }

  return result
}
